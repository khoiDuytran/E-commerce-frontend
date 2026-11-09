"use client";

import {
  handleCreateVariantAction,
  handleDeleteVariantAction,
  handleGetVariantsByProductAction,
  handleUpdateVariantAction,
} from "@/utils/actions";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import ImageUploadField, { discardUnsavedImages } from "./image.upload.field";
import {
  formatPrice,
  formatPriceInput,
  grossMarginPercent,
  originalPriceRule,
  parsePriceInput,
} from "./price.helpers";

export interface IVariant {
  _id: string;
  product: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  images?: string[];
  isActive: boolean;
}

interface IProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

interface VariantFormValues {
  sku: string;
  name: string;
  color?: string;
  size?: string;
  price: number;
  originalPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  images?: string[];
  isActive?: boolean;
}

const ProductVariantsModal = ({ product, isOpen, onClose }: IProps) => {
  const [variants, setVariants] = useState<IVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<IVariant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm<VariantFormValues>();
  // Hộp thoại dạng hook để nhận theme và context của antd
  const [dialog, dialogContextHolder] = Modal.useModal();

  const productId = product?._id;
  const openedProductId = isOpen ? productId : undefined;

  // Mở modal cho sản phẩm khác: đặt lại trạng thái ngay trong lúc render
  const [prevOpenedId, setPrevOpenedId] = useState(openedProductId);
  if (prevOpenedId !== openedProductId) {
    setPrevOpenedId(openedProductId);
    setIsFormOpen(false);
    setEditingVariant(null);
    setLoading(Boolean(openedProductId));
  }

  // Trả về null khi lỗi để giữ nguyên danh sách đang hiển thị
  const fetchVariants = useCallback(async () => {
    if (!productId) return null;
    try {
      const res = await handleGetVariantsByProductAction(productId);
      return (res?.data?.results ?? []) as IVariant[];
    } catch {
      message.error("Lỗi khi tải danh sách biến thể");
      return null;
    }
  }, [productId]);

  const loadVariants = async () => {
    setLoading(true);
    const results = await fetchVariants();
    if (results) setVariants(results);
    setLoading(false);
  };

  useEffect(() => {
    if (!openedProductId) return;
    let ignore = false;
    // Không reset form ở đây: Form chỉ mount khi mở form thêm/sửa (lúc đó đã reset),
    // gọi form khi chưa mount sẽ bị antd cảnh báo "not connected to any Form element"
    fetchVariants().then((results) => {
      if (ignore) return;
      if (results) setVariants(results);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [openedProductId, fetchVariants]);

  // Trả về false nếu chưa đóng được vì ảnh đang tải dở
  const cancelForm = () => {
    if (isUploading) {
      message.warning("Vui lòng chờ tải ảnh xong");
      return false;
    }
    if (isFormOpen) {
      discardUnsavedImages(
        form.getFieldValue("images"),
        editingVariant?.images ?? [],
      );
      setIsFormOpen(false);
      setEditingVariant(null);
    }
    return true;
  };

  const closeModal = () => {
    if (cancelForm()) onClose();
  };

  const openCreateForm = () => {
    if (!cancelForm()) return;
    setEditingVariant(null);
    form.resetFields();
    // Gợi ý SKU tự động theo slug của sản phẩm
    const autoSku = `${product?.slug?.slice(0, 10).toUpperCase()}-V${variants.length + 1}`;
    form.setFieldsValue({
      sku: autoSku,
      price: product?.basePrice ?? 0,
      stock: 10,
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openUpdateForm = (item: IVariant) => {
    if (!cancelForm()) return;
    setEditingVariant(item);
    form.resetFields();
    form.setFieldsValue({
      sku: item.sku,
      name: item.name,
      color: item.attributes?.color ?? "",
      size: item.attributes?.size ?? "",
      price: item.price,
      originalPrice: item.originalPrice ?? null,
      costPrice: item.costPrice ?? null,
      stock: item.stock,
      images: item.images ?? [],
      isActive: item.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSaveVariant = async (values: VariantFormValues) => {
    if (!product?._id) return;

    setIsSaving(true);
    try {
      const attributes: Record<string, string> = {};
      if (values.color?.trim()) attributes.color = values.color.trim();
      if (values.size?.trim()) attributes.size = values.size.trim();

      const payload = {
        product: product._id,
        sku: values.sku.trim().toUpperCase(),
        name: values.name.trim(),
        attributes,
        price: values.price,
        // Tạo mới bỏ trống thì không gửi; sửa thì gửi null để xoá giá đã lưu
        originalPrice:
          values.originalPrice ?? (editingVariant ? null : undefined),
        costPrice: values.costPrice ?? (editingVariant ? null : undefined),
        stock: values.stock ?? 0,
        images: values.images ?? [],
        isActive: values.isActive ?? true,
      };

      const res = editingVariant
        ? await handleUpdateVariantAction({
            _id: editingVariant._id,
            ...payload,
          })
        : await handleCreateVariantAction(payload);

      if (res?.data) {
        message.success(
          editingVariant
            ? "Cập nhật biến thể thành công"
            : "Thêm biến thể mới thành công",
        );
        setIsFormOpen(false);
        setEditingVariant(null);
        form.resetFields();
        await loadVariants();
      } else {
        const errorMsg = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.message || "Thao tác biến thể thất bại";
        notification.error({
          message: "Lỗi",
          description: errorMsg,
        });
      }
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi lưu biến thể",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hideVariant = async (variant: IVariant) => {
    if (!product?._id) return;
    const res = await handleUpdateVariantAction({
      _id: variant._id,
      product: product._id,
      isActive: false,
    });
    if (res?.data) {
      message.success(`Đã ẩn biến thể ${variant.name}`);
      await loadVariants();
    } else {
      notification.error({
        title: "Không thể ẩn biến thể",
        description: res?.message || "Vui lòng thử lại.",
      });
    }
  };

  const handleDeleteVariant = async (variant: IVariant) => {
    if (!product?._id) return;
    try {
      const res = await handleDeleteVariantAction(variant._id, product._id);
      if (res && (+res.statusCode === 200 || +res.statusCode === 204)) {
        message.success("Xóa biến thể thành công");
        await loadVariants();
      } else if (+(res?.statusCode ?? 0) === 409) {
        // Biến thể đã có đơn hàng: backend không cho xóa, đề nghị ẩn thay thế
        if (variant.isActive) {
          dialog.confirm({
            title: "Không thể xóa biến thể",
            content: `${res.message} Ẩn biến thể ngay bây giờ?`,
            okText: "Ẩn biến thể",
            cancelText: "Đóng",
            onOk: () => hideVariant(variant),
          });
        } else {
          dialog.info({
            title: "Không thể xóa biến thể",
            content: `${res.message} Biến thể này đang ẩn nên khách không còn chọn được.`,
            okText: "Đã hiểu",
          });
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: res?.message || "Không thể xóa biến thể",
        });
      }
    } catch {
      message.error("Lỗi khi kết nối máy chủ");
    }
  };

  const columns: TableProps<IVariant>["columns"] = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (sku: string) => <Tag color="blue">{sku}</Tag>,
    },
    {
      title: "Tên biến thể",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Thuộc tính",
      key: "attributes",
      render: (_, record) => {
        const attrs = record.attributes || {};
        return (
          <Space orientation="horizontal" size="small" wrap>
            {attrs.color && <Tag color="magenta">Màu: {attrs.color}</Tag>}
            {attrs.size && <Tag color="cyan">Size: {attrs.size}</Tag>}
            {!attrs.color && !attrs.size && (
              <span className="text-gray-400 text-xs">Mặc định</span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
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
      render: (cost: number | undefined, record) => {
        if (cost == null) return <span className="text-gray-400">---</span>;
        const margin = grossMarginPercent(record.price, cost);
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
      render: (stock: number) => (
        <Tag color={stock > 0 ? "green" : "red"}>{stock} sp</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Đang bán" : "Ẩn"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: "#fa8c16" }} />}
            onClick={() => openUpdateForm(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Biến thể sẽ bị xóa vĩnh viễn. Biến thể đã có đơn hàng chỉ ẩn được, không xóa được."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteVariant(record)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <span className="text-lg font-bold">Quản lý Biến thể Sản phẩm</span>
          {product && (
            <div className="text-sm text-gray-500 font-normal">
              Sản phẩm: <span className="font-semibold text-blue-600">{product.name}</span>
            </div>
          )}
        </div>
      }
      open={isOpen}
      onCancel={closeModal}
      width={{ xs: "100%", md: 960, xl: 1200 }}
      footer={[
        <Button key="close" onClick={closeModal}>
          Đóng
        </Button>,
      ]}
    >
      {/* Hộp thoại chỉ mở khi modal này đang mở nên đặt holder bên trong */}
      {dialogContextHolder}
      <div className="py-2">
        <div className="flex justify-between items-center mb-4">
          <Space orientation="horizontal">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateForm}
            >
              Thêm biến thể
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadVariants}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
          <span className="text-gray-500 text-sm">
            Tổng số: <b>{variants.length}</b> biến thể
          </span>
        </div>

        {/* Khối Form thêm / sửa biến thể */}
        {isFormOpen && (
          <Card
            title={editingVariant ? "Chỉnh sửa biến thể" : "Thêm biến thể mới"}
            className="mb-4 bg-gray-50 border-blue-200"
            size="small"
            extra={
              <Button type="link" size="small" onClick={cancelForm}>
                Đóng form
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveVariant}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="sku"
                    label="Mã SKU"
                    rules={[{ required: true, message: "Vui lòng nhập SKU" }]}
                  >
                    <Input placeholder="VD: SP-DO-XL" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="name"
                    label="Tên biến thể"
                    rules={[{ required: true, message: "Vui lòng nhập tên biến thể" }]}
                  >
                    <Input placeholder="VD: Màu Đỏ - Size XL" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="color" label="Màu sắc (Color)">
                    <Input placeholder="VD: Đỏ, Xanh, Đen..." />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="size" label="Kích thước (Size)">
                    <Input placeholder="VD: S, M, L, XL, 42..." />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="price"
                    label="Giá bán (VND)"
                    rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={1000}
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
                    dependencies={["price"]}
                    rules={[originalPriceRule("price")]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={1000}
                      style={{ width: "100%" }}
                      placeholder="Không giảm giá"
                      formatter={formatPriceInput}
                      parser={parsePriceInput}
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
                      step={1000}
                      style={{ width: "100%" }}
                      placeholder="Chưa nhập"
                      formatter={formatPriceInput}
                      parser={parsePriceInput}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="stock"
                    label="Số lượng tồn kho"
                    rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="isActive"
                    label="Mở bán biến thể"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="images" label="Ảnh biến thể">
                <ImageUploadField
                  savedUrls={editingVariant?.images ?? []}
                  onUploadingChange={setIsUploading}
                />
              </Form.Item>

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={cancelForm}>Hủy bỏ</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSaving}
                  disabled={isUploading}
                >
                  {editingVariant ? "Cập nhật biến thể" : "Tạo biến thể"}
                </Button>
              </div>
            </Form>
          </Card>
        )}

        <Table
          columns={columns}
          dataSource={variants}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </div>
    </Modal>
  );
};

export default ProductVariantsModal;

