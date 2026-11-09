"use client";

import {
  handleCreateProductAction,
  handleDeleteProductAction,
  handleUpdateProductAction,
} from "@/utils/actions";
import {
  ApartmentOutlined,
  DeleteTwoTone,
  EditTwoTone,
  PlusOutlined,
  SearchOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ImageUploadField, { discardUnsavedImages } from "./image.upload.field";
import ProductVariantsModal from "./product.variants.modal";
import {
  formatPrice,
  formatPriceInput,
  grossMarginPercent,
  originalPriceRule,
  parsePriceInput,
} from "./price.helpers";

export interface ICategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sizeGuide?: string;
  detailsFit?: string;
  category: { _id: string; name: string } | string;
  images: string[];
  basePrice: number;
  originalPrice?: number;
  costPrice?: number;
  tags?: string[];
  soldCount: number;
  stock: number;
  isActive: boolean;
  // Có biến thể thì stock là tổng tồn các biến thể đang bật, backend tự cập nhật
  variantCount?: number;
}

interface PaginationMeta {
  current: number;
  pageSize: number;
  pages: number;
  total: number;
}

interface IProps {
  products: IProduct[];
  categories: ICategoryOption[];
  meta?: PaginationMeta;
  error?: string;
}

interface ProductFormValues {
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  originalPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  images?: string[];
  tags?: string[];
  description?: string;
  sizeGuide?: string;
  detailsFit?: string;
  isActive?: boolean;
}

const DEFAULT_META: PaginationMeta = {
  current: 1,
  pageSize: 10,
  pages: 0,
  total: 0,
};

// Hàm chuyển đổi tiêu đề tiếng Việt thành slug URL
const convertToSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
};

const ProductTable = ({ products, categories, meta, error }: IProps) => {
  const paginationMeta = meta ?? DEFAULT_META;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [form] = Form.useForm<ProductFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Hộp thoại dạng hook để nhận theme và context của antd
  const [modal, modalContextHolder] = Modal.useModal();

  // Quản lý modal biến thể
  const [selectedProductForVariants, setSelectedProductForVariants] =
    useState<IProduct | null>(null);
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);

  // Bộ lọc
  const [searchName, setSearchName] = useState(searchParams.get("name") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get("category") || undefined,
  );

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = () => {
    updateQuery({
      name: searchName.trim() || null,
      category: selectedCategory || null,
      current: "1",
    });
  };

  const handleResetFilters = () => {
    setSearchName("");
    setSelectedCategory(undefined);
    router.replace(pathname);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      basePrice: 100000,
      stock: 50,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openUpdateModal = (product: IProduct) => {
    setEditingProduct(product);
    form.resetFields();

    const categoryId =
      typeof product.category === "object"
        ? product.category?._id
        : product.category;

    form.setFieldsValue({
      name: product.name,
      slug: product.slug,
      category: categoryId,
      basePrice: product.basePrice,
      originalPrice: product.originalPrice ?? null,
      costPrice: product.costPrice ?? null,
      stock: product.stock,
      images: product.images ?? [],
      tags: product.tags ?? [],
      description: product.description ?? "",
      sizeGuide: product.sizeGuide ?? "",
      detailsFit: product.detailsFit ?? "",
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const cancelModal = () => {
    // Đóng lúc đang tải thì ảnh tải xong sẽ không còn form nào giữ URL của nó
    if (isUploading) {
      message.warning("Vui lòng chờ tải ảnh xong");
      return;
    }
    discardUnsavedImages(
      form.getFieldValue("images"),
      editingProduct?.images ?? [],
    );
    closeModal();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) {
      const generatedSlug = convertToSlug(e.target.value);
      form.setFieldsValue({ slug: generatedSlug });
    }
  };

  const hasVariants = (editingProduct?.variantCount ?? 0) > 0;

  const onFinish = async (values: ProductFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
        category: values.category,
        basePrice: values.basePrice,
        // Tạo mới bỏ trống thì không gửi; sửa thì gửi null để xoá giá đã lưu
        originalPrice:
          values.originalPrice ?? (editingProduct ? null : undefined),
        costPrice: values.costPrice ?? (editingProduct ? null : undefined),
        // Sản phẩm có biến thể không gửi tồn kho: backend tự tính từ biến thể
        ...(hasVariants ? {} : { stock: values.stock ?? 0 }),
        images: values.images ?? [],
        tags: values.tags ?? [],
        description: values.description?.trim() || undefined,
        // Gửi chuỗi rỗng thay vì undefined để xóa được nội dung đã lưu
        sizeGuide: values.sizeGuide?.trim() ?? "",
        detailsFit: values.detailsFit?.trim() ?? "",
        isActive: values.isActive ?? true,
      };

      const res = editingProduct
        ? await handleUpdateProductAction({
            _id: editingProduct._id,
            ...payload,
          })
        : await handleCreateProductAction(payload);

      if (res?.data) {
        message.success(
          editingProduct
            ? "Cập nhật sản phẩm thành công"
            : "Tạo sản phẩm mới thành công",
        );
        closeModal();
      } else {
        const errorMsg = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.message || "Thao tác thất bại";
        notification.error({
          message: "Lỗi",
          description: errorMsg,
        });
      }
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi lưu sản phẩm",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hideProduct = async (product: IProduct) => {
    const res = await handleUpdateProductAction({
      _id: product._id,
      isActive: false,
    });
    if (res?.data) {
      message.success(`Đã ẩn sản phẩm ${product.name}`);
    } else {
      notification.error({
        title: "Không thể ẩn sản phẩm",
        description: res?.message || "Vui lòng thử lại.",
      });
    }
  };

  const handleDelete = async (product: IProduct) => {
    const id = product._id;
    setIsDeleting(id);
    try {
      const res = await handleDeleteProductAction(id);
      if (res && (+res.statusCode === 200 || +res.statusCode === 204)) {
        message.success("Xóa sản phẩm thành công");
      } else if (+(res?.statusCode ?? 0) === 409) {
        // Sản phẩm đã có đơn hàng: backend không cho xóa, đề nghị ẩn thay thế
        if (product.isActive) {
          modal.confirm({
            title: "Không thể xóa sản phẩm",
            content: `${res.message} Ẩn sản phẩm ngay bây giờ?`,
            okText: "Ẩn sản phẩm",
            cancelText: "Đóng",
            onOk: () => hideProduct(product),
          });
        } else {
          modal.info({
            title: "Không thể xóa sản phẩm",
            content: `${res.message} Sản phẩm này đang ẩn nên khách không còn thấy.`,
            okText: "Đã hiểu",
          });
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể xóa sản phẩm",
        });
      }
    } catch {
      message.error("Lỗi khi kết nối máy chủ");
    } finally {
      setIsDeleting(null);
    }
  };

  const openVariantsModal = (product: IProduct) => {
    setSelectedProductForVariants(product);
    setIsVariantsModalOpen(true);
  };

  const columns: TableProps<IProduct>["columns"] = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) =>
        index + 1 + (paginationMeta.current - 1) * paginationMeta.pageSize,
    },
    {
      title: "Ảnh",
      dataIndex: "images",
      key: "images",
      width: 80,
      render: (images: string[]) => {
        const firstImg = images?.[0];
        return firstImg ? (
          <Image
            src={firstImg}
            alt="product"
            width={48}
            height={48}
            className="rounded object-cover border border-gray-200"
            fallback="https://via.placeholder.com/48?text=SP"
          />
        ) : (
          <Avatar shape="square" size={48} icon={<ShoppingOutlined />} />
        );
      },
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-gray-800 text-sm hover:text-blue-600 transition">
            {name}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">/{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (cat) => {
        const catName = typeof cat === "object" ? cat?.name : cat;
        return catName ? (
          <Tag color="blue">{catName}</Tag>
        ) : (
          <span className="text-gray-400">---</span>
        );
      },
    },
    {
      title: "Giá bán",
      dataIndex: "basePrice",
      key: "basePrice",
      align: "right",
      render: (price: number, record) => (
        <div>
          <div className="font-semibold text-emerald-600">
            {formatPrice(price)}
          </div>
          {record.originalPrice != null && record.originalPrice > price && (
            <div className="text-xs text-gray-400 line-through">
              {formatPrice(record.originalPrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giá nhập",
      dataIndex: "costPrice",
      key: "costPrice",
      align: "right",
      render: (cost: number | undefined, record) => {
        if (cost == null) return <span className="text-gray-400">---</span>;
        const margin = grossMarginPercent(record.basePrice, cost);
        return (
          <div>
            <div>{formatPrice(cost)}</div>
            {margin != null && (
              <div
                className={`text-xs ${margin < 0 ? "text-red-500" : "text-gray-500"}`}
              >
                Lãi gộp {margin}%
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      render: (stock: number, record) => {
        const tag = <Tag color={stock > 0 ? "green" : "red"}>{stock} sp</Tag>;
        if (!record.variantCount) return tag;
        return (
          <Tooltip
            title={`Tổng tồn kho của các biến thể đang bật (${record.variantCount} biến thể)`}
          >
            <span className="cursor-help">
              {tag}
              <div className="text-xs text-neutral-500">theo biến thể</div>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Đã bán",
      dataIndex: "soldCount",
      key: "soldCount",
      align: "center",
      render: (sold: number) => <Tag color="purple">{sold || 0}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Đang bán" : "Tạm ẩn"}
        </Tag>
      ),
    },
    {
      title: "Biến thể",
      key: "variants",
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          type="dashed"
          icon={<ApartmentOutlined />}
          className="text-blue-600 border-blue-400"
          onClick={() => openVariantsModal(record)}
        >
          Biến thể{record.variantCount ? ` (${record.variantCount})` : ""}
        </Button>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Tooltip title="Chỉnh sửa sản phẩm">
            <EditTwoTone
              twoToneColor="#f57800"
              className="cursor-pointer text-base"
              onClick={() => openUpdateModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Sản phẩm và các biến thể sẽ bị xóa vĩnh viễn. Sản phẩm đã có đơn hàng chỉ ẩn được, không xóa được."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeleting === record._id }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa sản phẩm">
              <DeleteTwoTone
                twoToneColor="#ff4d4f"
                className="cursor-pointer text-base"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {modalContextHolder}
      {error && (
        <Alert
          title="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Header và Bộ lọc */}
      <Card size="small" className="shadow-sm">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} sm={10}>
                <Input
                  placeholder="Tìm theo tên sản phẩm..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onPressEnter={handleSearch}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={8}>
                <Select
                  placeholder="Lọc danh mục"
                  allowClear
                  className="w-full"
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Space orientation="horizontal">
                  <Button type="primary" onClick={handleSearch}>
                    Lọc
                  </Button>
                  <Button onClick={handleResetFilters}>Đặt lại</Button>
                </Space>
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={6} className="text-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              size="middle"
            >
              Thêm sản phẩm
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bảng danh sách sản phẩm */}
      <Card size="small" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="_id"
          pagination={{
            current: paginationMeta.current,
            pageSize: paginationMeta.pageSize,
            total: paginationMeta.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên tổng số ${total} sản phẩm`,
            onChange: (page, pageSize) => {
              updateQuery({
                current: String(page),
                pageSize: String(pageSize),
              });
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal Thêm mới / Cập nhật Sản phẩm */}
      <Modal
        title={
          <span className="text-lg font-bold">
            {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </span>
        }
        open={isModalOpen}
        onCancel={cancelModal}
        // Màn hình lớn dùng hết chiều ngang hợp lý, màn nhỏ co theo màn hình
        width={{ xs: "100%", md: 900, xl: 1100 }}
        footer={[
          <Button key="cancel" onClick={cancelModal}>
            Hủy bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSaving}
            disabled={isUploading}
            onClick={() => form.submit()}
          >
            {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[
                  { required: true, message: "Vui lòng nhập tên sản phẩm" },
                ]}
              >
                <Input
                  placeholder="VD: Áo Thun Nam Thể Thao..."
                  onChange={handleNameChange}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="slug"
                label="Đường dẫn tĩnh (Slug)"
                rules={[{ required: true, message: "Vui lòng nhập slug" }]}
                tooltip="Tự động tạo từ tên hoặc chỉnh sửa thủ công"
              >
                <Input placeholder="ao-thun-nam-the-thao" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="category"
                label="Danh mục sản phẩm"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  showSearch
                  optionFilterProp="label"
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="costPrice"
                label="Giá nhập (VND)"
                tooltip="Giá vốn để tính lãi. Chỉ admin thấy, không hiển thị cho khách"
              >
                <InputNumber<number>
                  min={0}
                  step={10000}
                  style={{ width: "100%" }}
                  placeholder="Chưa nhập"
                  formatter={formatPriceInput}
                  parser={parsePriceInput}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="basePrice"
                label="Giá bán (VND)"
                tooltip="Giá khách trả khi đặt hàng"
                rules={[{ required: true, message: "Vui lòng nhập giá bán" }]}
              >
                <InputNumber<number>
                  min={0}
                  step={10000}
                  style={{ width: "100%" }}
                  formatter={formatPriceInput}
                  parser={parsePriceInput}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="originalPrice"
                label="Giá trước giảm (VND)"
                tooltip="Không bắt buộc. Lớn hơn giá bán thì cửa hàng hiện giá này gạch ngang kèm % giảm"
                dependencies={["basePrice"]}
                rules={[originalPriceRule("basePrice")]}
              >
                <InputNumber<number>
                  min={0}
                  step={10000}
                  style={{ width: "100%" }}
                  placeholder="Không giảm giá"
                  formatter={formatPriceInput}
                  parser={parsePriceInput}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="stock"
                label="Số lượng tồn kho"
                rules={
                  hasVariants
                    ? []
                    : [{ required: true, message: "Vui lòng nhập số lượng" }]
                }
                extra={
                  hasVariants
                    ? "Tính từ tổng tồn các biến thể. Sửa tồn kho trong mục Biến thể."
                    : undefined
                }
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  disabled={hasVariants}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Trạng thái kinh doanh"
            valuePropName="checked"
          >
            <Switch checkedChildren="Mở bán" unCheckedChildren="Tạm ẩn" />
          </Form.Item>

          <Form.Item name="images" label="Hình ảnh sản phẩm">
            <ImageUploadField
              savedUrls={editingProduct?.images ?? []}
              onUploadingChange={setIsUploading}
            />
          </Form.Item>

          <Form.Item name="tags" label="Thẻ sản phẩm (Tags)">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Nhập tag rồi ấn Enter (VD: new, hot, sale, fashion)"
              tokenSeparators={[","]}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sản phẩm">
            <Input.TextArea
              rows={4}
              placeholder="Nhập thông tin chi tiết, đặc điểm nổi bật của sản phẩm..."
            />
          </Form.Item>

          <Form.Item
            name="sizeGuide"
            label="Size"
            tooltip="Để trống thì mục này không hiển thị ở trang sản phẩm. Mục Details & Fit cũng vậy."
          >
            <Input.TextArea
              rows={3}
              placeholder={"S: Eo 70cm, Dài 100cm\nM: Eo 74cm, Dài 102cm"}
            />
          </Form.Item>

          <Form.Item name="detailsFit" label="Details & Fit">
            <Input.TextArea
              rows={3}
              placeholder={"- Khóa kéo YKK\n- Form ống hơi loe"}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Quản lý Biến thể (Variants) */}
      <ProductVariantsModal
        product={selectedProductForVariants}
        isOpen={isVariantsModalOpen}
        onClose={() => {
          setIsVariantsModalOpen(false);
          setSelectedProductForVariants(null);
        }}
      />
    </div>
  );
};

export default ProductTable;
