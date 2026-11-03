"use client";

import {
  handleCreateCouponAction,
  handleDeleteCouponAction,
  handleUpdateCouponAction,
} from "@/utils/actions";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Coupon {
  _id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface PaginationMeta {
  current: number;
  pageSize: number;
  pages: number;
  total: number;
}

type CouponFormValues = Omit<Coupon, "_id" | "usedCount"> & {
  usedCount?: number;
};

interface IProps {
  coupons: Coupon[];
  meta?: PaginationMeta;
  error?: string;
}

const DEFAULT_META: PaginationMeta = {
  current: 1,
  pageSize: 10,
  pages: 0,
  total: 0,
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN", { timeZone: "UTC" });
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const CouponTable = ({ coupons, meta, error }: IProps) => {
  const paginationMeta = meta ?? DEFAULT_META;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [form] = Form.useForm<CouponFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openUpdateModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.resetFields();
    form.setFieldsValue({
      ...coupon,
      startDate: coupon.startDate.slice(0, 10),
      endDate: coupon.endDate.slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values: CouponFormValues) => {
    if (values.endDate < values.startDate) {
      form.setFields([
        {
          name: "endDate",
          errors: ["Ngày kết thúc phải từ ngày bắt đầu trở đi."],
        },
      ]);
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...values,
        code: values.code.trim().toUpperCase(),
        minOrderValue: values.minOrderValue ?? undefined,
        maxDiscount: values.maxDiscount ?? undefined,
        usedCount: values.usedCount ?? undefined,
      };
      const res = editingCoupon
        ? await handleUpdateCouponAction({ _id: editingCoupon._id, ...data })
        : await handleCreateCouponAction(data);

      if (!res?.data) {
        const responseError = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.error;
        notification.error({
          title: editingCoupon ? "Cập nhật thất bại" : "Tạo coupon thất bại",
          description:
            responseError || res?.message || "Không thể lưu coupon.",
        });
        return;
      }

      message.success(
        editingCoupon ? "Cập nhật coupon thành công!" : "Tạo coupon thành công!",
      );
      closeModal();
      if (!editingCoupon) updateQuery({ current: "1" });
      router.refresh();
    } catch (error) {
      notification.error({
        title: "Không thể lưu coupon",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    setIsDeleting(coupon._id);
    try {
      const res = await handleDeleteCouponAction(coupon._id);
      if (!res?.data) {
        const responseError = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.error;
        notification.error({
          title: "Xóa coupon thất bại",
          description:
            responseError || res?.message || "Không thể xóa coupon.",
        });
        return;
      }

      message.success("Xóa coupon thành công!");
      if (coupons.length === 1 && paginationMeta.current > 1) {
        updateQuery({ current: String(paginationMeta.current - 1) });
      }
      router.refresh();
    } catch (error) {
      notification.error({
        title: "Không thể xóa coupon",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: TableProps<Coupon>["columns"] = [
    {
      title: "STT",
      render: (_value, _record, index) =>
        index + 1 + (paginationMeta.current - 1) * paginationMeta.pageSize,
    },
    {
      title: "Mã coupon",
      dataIndex: "code",
      key: "code",
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: "Mức giảm",
      key: "discount",
      render: (_value, coupon) =>
        coupon.discountType === "PERCENT"
          ? `${formatAmount(coupon.discountValue)}%`
          : `${formatAmount(coupon.discountValue)} ₫`,
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderValue",
      key: "minOrderValue",
      render: (value?: number) =>
        value === undefined ? "—" : `${formatAmount(value)} ₫`,
    },
    {
      title: "Lượt sử dụng",
      key: "usage",
      render: (_value, coupon) =>
        `${formatAmount(coupon.usedCount)} / ${formatAmount(coupon.usageLimit)}`,
    },
    {
      title: "Thời hạn",
      key: "validity",
      render: (_value, coupon) =>
        `${formatDate(coupon.startDate)} – ${formatDate(coupon.endDate)}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="green">Đang hoạt động</Tag>
        ) : (
          <Tag>Đã tắt</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_value, coupon) => (
        <Space>
          <EditTwoTone
            twoToneColor="#f57800"
            className="cursor-pointer"
            aria-label={`Sửa coupon ${coupon.code}`}
            onClick={() => openUpdateModal(coupon)}
          />
          <Popconfirm
            placement="leftTop"
            title="Xác nhận xóa coupon"
            description={`Bạn có chắc chắn muốn xóa "${coupon.code}"?`}
            onConfirm={() => deleteCoupon(coupon)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              type="text"
              aria-label={`Xóa coupon ${coupon.code}`}
              loading={isDeleting === coupon._id}
              icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<Coupon>["onChange"] = (pagination) => {
    updateQuery({
      current: pagination.current ? String(pagination.current) : "1",
      pageSize: pagination.pageSize
        ? String(pagination.pageSize)
        : String(paginationMeta.pageSize),
    });
  };

  const submitSearch = (value: string) => {
    updateQuery({ code: value.trim() || null, current: "1" });
  };

  return (
    <>
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title="Không thể tải danh sách coupon"
          description={error}
        />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-medium">Quản lý coupon</span>
        <Space wrap>
          <Input.Search
            key={searchParams.get("code") ?? ""}
            allowClear
            defaultValue={searchParams.get("code") ?? ""}
            placeholder="Tìm theo mã coupon"
            aria-label="Tìm theo mã coupon"
            onSearch={submitSearch}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={openCreateModal}>
            Tạo coupon
          </Button>
        </Space>
      </div>
      <Table<Coupon>
        bordered
        dataSource={coupons}
        columns={columns}
        rowKey="_id"
        locale={{ emptyText: "Không có coupon nào." }}
        pagination={{
          current: paginationMeta.current,
          pageSize: paginationMeta.pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          total: paginationMeta.total,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} trên ${total} coupon`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingCoupon ? "Cập nhật coupon" : "Tạo coupon"}
        open={isModalOpen}
        confirmLoading={isSaving}
        onOk={() => form.submit()}
        onCancel={closeModal}
        okText={editingCoupon ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        mask={{ closable: false }}
        forceRender
      >
        <Form<CouponFormValues>
          form={form}
          name="coupon-form"
          layout="vertical"
          preserve={false}
          initialValues={
            {
              discountType: "PERCENT",
              usedCount: 0,
              isActive: true,
            }
          }
          onFinish={onFinish}
        >
          <Form.Item
            label="Mã coupon"
            name="code"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập mã coupon.",
              },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            label="Loại giảm giá"
            name="discountType"
            rules={[{ required: true, message: "Vui lòng chọn loại giảm giá." }]}
          >
            <Select
              options={[
                { value: "PERCENT", label: "Phần trăm" },
                { value: "FIXED", label: "Số tiền cố định" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Giá trị giảm"
            name="discountValue"
            rules={[
              { required: true, message: "Vui lòng nhập giá trị giảm." },
              {
                type: "number",
                min: 0,
                message: "Giá trị giảm phải lớn hơn hoặc bằng 0.",
              },
            ]}
          >
            <InputNumber min={0} step={0.01} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Đơn hàng tối thiểu (₫)"
            name="minOrderValue"
            rules={[
              {
                type: "number",
                min: 0,
                message: "Giá trị phải lớn hơn hoặc bằng 0.",
              },
            ]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Giảm tối đa (₫)"
            name="maxDiscount"
            rules={[
              {
                type: "number",
                min: 0,
                message: "Giá trị phải lớn hơn hoặc bằng 0.",
              },
            ]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Giới hạn lượt sử dụng"
            name="usageLimit"
            rules={[
              { required: true, message: "Vui lòng nhập giới hạn lượt dùng." },
              {
                type: "number",
                min: 1,
                message: "Giới hạn lượt dùng tối thiểu là 1.",
              },
            ]}
          >
            <InputNumber min={1} precision={0} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Đã sử dụng"
            name="usedCount"
            rules={[
              {
                type: "number",
                min: 0,
                message: "Số lượt đã dùng không được âm.",
              },
            ]}
          >
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Ngày bắt đầu"
            name="startDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu." }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            label="Ngày kết thúc"
            name="endDate"
            rules={[
              { required: true, message: "Vui lòng chọn ngày kết thúc." },
              {
                validator: async (_, endDate: string) => {
                  const startDate = form.getFieldValue("startDate");
                  if (
                    startDate &&
                    endDate &&
                    endDate < startDate
                  ) {
                    throw new Error(
                      "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
                    );
                  }
                },
              },
            ]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            label="Đang hoạt động"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CouponTable;
