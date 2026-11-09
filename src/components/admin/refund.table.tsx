"use client";

import { handleUpdateRefundAction } from "@/utils/actions";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FilterOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useState } from "react";

interface IProps {
  refunds: IRefundRecord[];
  meta: IPageMeta;
  filters: { orderCode: string; status?: RefundStatus };
  error?: string;
}

interface RefundFormValues {
  adminNote?: string;
}

interface PendingAction {
  refund: IRefundRecord;
  nextStatus: RefundStatus;
}

const STATUS_TAGS: Record<RefundStatus, { color: string; label: string }> = {
  REQUESTED: { color: "gold", label: "Chờ duyệt" },
  APPROVED: { color: "blue", label: "Đã duyệt, chờ nhận hàng" },
  RECEIVED: { color: "purple", label: "Đã nhận hàng, chờ hoàn tiền" },
  REFUNDED: { color: "green", label: "Đã hoàn tiền" },
  REJECTED: { color: "default", label: "Đã từ chối" },
};

// Khớp với bảng chuyển trạng thái trong refunds.service của backend
const NEXT_ACTIONS: Record<
  RefundStatus,
  { status: RefundStatus; label: string; icon: ReactNode; danger?: boolean }[]
> = {
  REQUESTED: [
    { status: "APPROVED", label: "Duyệt", icon: <CheckCircleOutlined /> },
    {
      status: "REJECTED",
      label: "Từ chối",
      icon: <CloseCircleOutlined />,
      danger: true,
    },
  ],
  APPROVED: [
    { status: "RECEIVED", label: "Đã nhận hàng", icon: <InboxOutlined /> },
  ],
  RECEIVED: [
    { status: "REFUNDED", label: "Hoàn tiền", icon: <DollarOutlined /> },
  ],
  REFUNDED: [],
  REJECTED: [],
};

const MODAL_TITLES: Record<RefundStatus, string> = {
  REQUESTED: "",
  APPROVED: "Duyệt yêu cầu hoàn hàng",
  REJECTED: "Từ chối yêu cầu hoàn hàng",
  RECEIVED: "Xác nhận đã nhận hàng hoàn",
  REFUNDED: "Xác nhận hoàn tiền",
};

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value || 0,
  );

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "---";

const errorText = (res: IBackendRes<unknown> | undefined, fallback: string) =>
  (Array.isArray(res?.error) ? res.error.join(", ") : res?.error) ||
  res?.message ||
  fallback;

// Giải thích hậu quả của từng bước để admin không thao tác nhầm
const ActionNotice = ({ action }: { action: PendingAction }) => {
  const { refund, nextStatus } = action;
  const amount = formatVnd(refund.refundAmount);

  if (nextStatus === "APPROVED") {
    return (
      <Alert
        type="info"
        showIcon
        title="Khách sẽ nhận thông báo yêu cầu đã được duyệt và gửi hàng về cửa hàng."
      />
    );
  }
  if (nextStatus === "REJECTED") {
    return (
      <Alert
        type="warning"
        showIcon
        title="Yêu cầu sẽ đóng lại và không mở lại được. Ghi rõ lý do để khách biết."
      />
    );
  }
  if (nextStatus === "RECEIVED") {
    return (
      <Alert
        type="info"
        showIcon
        title="Tồn kho của các sản phẩm trong đơn sẽ được cộng lại."
      />
    );
  }
  if (refund.paymentMethod === "VNPAY") {
    return (
      <Alert
        type="warning"
        showIcon
        title={`Hệ thống sẽ gọi VNPay hoàn ${amount} về tài khoản của khách.`}
        description="Nếu VNPay từ chối, yêu cầu giữ nguyên trạng thái để bạn thử lại."
      />
    );
  }
  return (
    <Alert
      type="warning"
      showIcon
      title={`Đơn ${refund.paymentMethod ?? "không rõ phương thức"}: hệ thống chỉ ghi nhận đã hoàn.`}
      description={`Hãy tự chuyển ${amount} cho khách trước khi xác nhận.`}
    />
  );
};

const RefundTable = ({ refunds, meta, filters, error }: IProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<RefundFormValues>();

  const [searchCode, setSearchCode] = useState(filters.orderCode);
  const [selectedStatus, setSelectedStatus] = useState<
    RefundStatus | undefined
  >(filters.status);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

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
      orderCode: searchCode.trim() || null,
      status: selectedStatus ?? null,
      current: "1",
    });
  };

  const handleResetFilters = () => {
    setSearchCode("");
    setSelectedStatus(undefined);
    router.replace(pathname);
  };

  const openAction = (refund: IRefundRecord, nextStatus: RefundStatus) => {
    form.resetFields();
    form.setFieldsValue({ adminNote: refund.adminNote ?? "" });
    setPendingAction({ refund, nextStatus });
  };

  const closeAction = () => {
    if (isSaving) return;
    setPendingAction(null);
  };

  const submitAction = async (values: RefundFormValues) => {
    if (!pendingAction) return;
    const { refund, nextStatus } = pendingAction;
    const adminNote = values.adminNote?.trim();

    setIsSaving(true);
    try {
      const res = await handleUpdateRefundAction(refund._id, {
        status: nextStatus,
        ...(adminNote ? { adminNote } : {}),
      });
      if (res?.data) {
        message.success(
          `Đơn ${refund.orderCode}: ${STATUS_TAGS[nextStatus].label.toLowerCase()}`,
        );
        setPendingAction(null);
        router.refresh();
      } else {
        notification.error({
          title: "Cập nhật thất bại",
          description: errorText(res, "Không cập nhật được yêu cầu hoàn hàng."),
        });
      }
    } catch {
      message.error("Lỗi khi kết nối với máy chủ");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: TableProps<IRefundRecord>["columns"] = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1 + (meta.current - 1) * meta.pageSize,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (code: string) => (
        <span className="font-mono font-semibold">{code}</span>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-800">
            {record.userId?.name ||
              record.orderId?.shippingAddress?.fullName ||
              "---"}
          </div>
          <div className="text-xs text-gray-400">
            {record.userId?.email ?? record.orderId?.shippingAddress?.phone}
          </div>
        </div>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: { showTitle: false },
      render: (reason: string) => (
        <Tooltip title={reason}>
          <span>{reason}</span>
        </Tooltip>
      ),
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "refundAmount",
      key: "refundAmount",
      align: "right",
      render: (amount: number) => (
        <span className="font-semibold text-emerald-600">
          {formatVnd(amount)}
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      align: "center",
      render: (method: IRefundRecord["paymentMethod"]) =>
        method ? (
          <Tag color={method === "VNPAY" ? "blue" : "default"}>{method}</Tag>
        ) : (
          "---"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: RefundStatus) => {
        const tag = STATUS_TAGS[status];
        return <Tag color={tag?.color}>{tag?.label ?? status}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => (
        <span className="text-xs text-gray-500">{formatDate(value)}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const actions = NEXT_ACTIONS[record.status] ?? [];
        if (actions.length === 0) {
          return <span className="text-xs text-gray-400">Đã xử lý xong</span>;
        }
        return (
          <Space size="small">
            {actions.map((action) => (
              <Button
                key={action.status}
                size="small"
                type={action.danger ? "default" : "primary"}
                danger={action.danger}
                icon={action.icon}
                onClick={() => openAction(record, action.status)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        );
      },
    },
  ];

  const renderDetail = (record: IRefundRecord) => (
    <Descriptions size="small" column={1} bordered>
      <Descriptions.Item label="Mô tả của khách">
        {record.description || "---"}
      </Descriptions.Item>
      <Descriptions.Item label="Sản phẩm">
        {record.orderId?.items?.length ? (
          <ul className="list-disc pl-4">
            {record.orderId.items.map((item, index) => (
              <li key={index}>
                {item.productName}
                {item.variantName ? ` (${item.variantName})` : ""} ×{" "}
                {item.quantity} · {formatVnd(item.price)}
              </li>
            ))}
          </ul>
        ) : (
          "Không tìm thấy đơn hàng"
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Phản hồi của cửa hàng">
        {record.adminNote || "---"}
      </Descriptions.Item>
      {record.refundedAt && (
        <Descriptions.Item label="Hoàn tiền lúc">
          {formatDate(record.refundedAt)}
        </Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <div className="space-y-4">
      {error && (
        <Alert
          title="Lỗi tải danh sách hoàn hàng"
          description={error}
          type="error"
          showIcon
        />
      )}

      <Card size="small" className="shadow-sm">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} sm={10}>
                <Input
                  placeholder="Tìm theo mã đơn (ORD-...)"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onPressEnter={handleSearch}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={8}>
                <Select<RefundStatus>
                  placeholder="Trạng thái"
                  allowClear
                  className="w-full"
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value)}
                  options={(Object.keys(STATUS_TAGS) as RefundStatus[]).map(
                    (value) => ({ value, label: STATUS_TAGS[value].label }),
                  )}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Space>
                  <Button
                    type="primary"
                    icon={<FilterOutlined />}
                    onClick={handleSearch}
                  >
                    Lọc
                  </Button>
                  <Button onClick={handleResetFilters}>Đặt lại</Button>
                </Space>
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={6} className="text-right">
            <Button icon={<ReloadOutlined />} onClick={() => router.refresh()}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card size="small" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={refunds}
          rowKey="_id"
          expandable={{ expandedRowRender: renderDetail }}
          pagination={{
            current: meta.current,
            pageSize: meta.pageSize,
            total: meta.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên tổng số ${total} yêu cầu`,
            onChange: (page, pageSize) =>
              updateQuery({ current: String(page), pageSize: String(pageSize) }),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={pendingAction ? MODAL_TITLES[pendingAction.nextStatus] : ""}
        open={!!pendingAction}
        confirmLoading={isSaving}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ danger: pendingAction?.nextStatus === "REJECTED" }}
        cancelButtonProps={{ disabled: isSaving }}
        closable={!isSaving}
        mask={{ closable: !isSaving }}
        onOk={() => form.submit()}
        onCancel={closeAction}
      >
        {pendingAction && (
          <Space orientation="vertical" className="w-full" size="middle">
            <Typography.Text>
              Đơn <b>{pendingAction.refund.orderCode}</b> ·{" "}
              {formatVnd(pendingAction.refund.refundAmount)}
            </Typography.Text>
            <ActionNotice action={pendingAction} />
          </Space>
        )}
        <Form<RefundFormValues>
          form={form}
          layout="vertical"
          className="mt-4"
          onFinish={submitAction}
        >
          <Form.Item
            name="adminNote"
            label="Phản hồi cho khách"
            rules={[
              {
                required: pendingAction?.nextStatus === "REJECTED",
                whitespace: true,
                message: "Vui lòng nhập lý do từ chối",
              },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RefundTable;
