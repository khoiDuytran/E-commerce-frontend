"use client";

import { handleUpdateOrderAction } from "@/utils/actions";
import {
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import OrderDetailDrawer, { IOrder } from "./order.detail.drawer";

interface PaginationMeta {
  current: number;
  pageSize: number;
  pages: number;
  total: number;
}

interface IProps {
  orders: IOrder[];
  meta?: PaginationMeta;
  error?: string;
}

const DEFAULT_META: PaginationMeta = {
  current: 1,
  pageSize: 10,
  pages: 0,
  total: 0,
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val || 0);
};

const OrderTable = ({ orders, meta, error }: IProps) => {
  const paginationMeta = meta ?? DEFAULT_META;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bộ lọc
  const [searchCode, setSearchCode] = useState(
    searchParams.get("orderCode") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    searchParams.get("status") || undefined,
  );
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    string | undefined
  >(searchParams.get("paymentStatus") || undefined);

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
      status: selectedStatus || null,
      paymentStatus: selectedPaymentStatus || null,
      current: "1",
    });
  };

  const handleResetFilters = () => {
    setSearchCode("");
    setSelectedStatus(undefined);
    setSelectedPaymentStatus(undefined);
    router.replace(pathname);
  };

  const handleQuickAdvance = async (
    order: IOrder,
    nextStatus: string,
    nextPaymentStatus?: string,
  ) => {
    setUpdatingId(order._id);
    try {
      const payload: {
        _id: string;
        status: string;
        paymentStatus?: string;
      } = {
        _id: order._id,
        status: nextStatus,
      };
      if (nextPaymentStatus) payload.paymentStatus = nextPaymentStatus;

      const res = await handleUpdateOrderAction(payload);
      if (res?.data) {
        message.success(`Đã cập nhật đơn hàng ${order.orderCode} sang ${nextStatus}`);
        router.refresh();
      } else {
        const errorMsg = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.message || "Cập nhật thất bại";
        notification.error({
          message: "Lỗi",
          description: errorMsg,
        });
      }
    } catch {
      message.error("Lỗi khi kết nối với máy chủ");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDrawer = (order: IOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag color="gold">Chờ xác nhận</Tag>;
      case "CONFIRMED":
        return <Tag color="blue">Đã xác nhận</Tag>;
      case "SHIPPING":
        return <Tag color="cyan">Đang giao hàng</Tag>;
      case "DELIVERED":
        return <Tag color="green">Giao thành công</Tag>;
      case "CANCELLED":
        return <Tag color="default">Đã hủy</Tag>;
      case "RETURN_REQUESTED":
        return <Tag color="magenta">Yêu cầu hoàn</Tag>;
      case "RETURN_APPROVED":
        return <Tag color="geekblue">Duyệt hoàn</Tag>;
      case "RETURN_RECEIVED":
        return <Tag color="purple">Đã nhận hàng trả</Tag>;
      case "REFUNDED":
        return <Tag color="volcano">Đã hoàn tiền</Tag>;
      case "RETURN_REJECTED":
        return <Tag color="default">Từ chối hoàn</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const renderPaymentStatusTag = (status: string) => {
    switch (status) {
      case "PAID":
        return <Tag color="success">Đã thanh toán</Tag>;
      case "UNPAID":
        return <Tag color="warning">Chưa thanh toán</Tag>;
      case "REFUNDED":
        return <Tag color="purple">Đã hoàn tiền</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: TableProps<IOrder>["columns"] = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) =>
        index + 1 + (paginationMeta.current - 1) * paginationMeta.pageSize,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (code: string, record) => (
        <a
          onClick={() => openDrawer(record)}
          className="font-mono font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: "Người nhận",
      key: "receiver",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-800">
            {record.shippingAddress?.fullName || "---"}
          </div>
          <div className="text-xs text-gray-400">
            {record.shippingAddress?.phone}
          </div>
        </div>
      ),
    },
    {
      title: "Tỉnh / Thành",
      key: "province",
      render: (_, record) => (
        <span className="text-gray-600 text-sm">
          {record.shippingAddress?.province || "---"}
        </span>
      ),
    },
    {
      title: "Sản phẩm",
      key: "itemCount",
      align: "center",
      render: (_, record) => (
        <Tooltip
          title={record.items?.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
        >
          <Tag color="blue">{record.items?.length || 0} món</Tag>
        </Tooltip>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (total: number) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(total)}
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      align: "center",
      render: (paymentStatus: string) => renderPaymentStatusTag(paymentStatus),
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => (
        <span className="text-xs text-gray-500">
          {new Date(dateStr).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const isCurrentUpdating = updatingId === record._id;

        return (
          <Space orientation="horizontal" size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#1677ff" }} />}
              onClick={() => openDrawer(record)}
            >
              Chi tiết
            </Button>

            {record.status === "PENDING" && (
              <Tooltip title="Xác nhận đơn hàng">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={isCurrentUpdating}
                  onClick={() => handleQuickAdvance(record, "CONFIRMED")}
                >
                  Duyệt
                </Button>
              </Tooltip>
            )}

            {record.status === "CONFIRMED" && (
              <Tooltip title="Giao cho shipper vận chuyển">
                <Button
                  type="primary"
                  size="small"
                  className="bg-sky-600 hover:bg-sky-500"
                  icon={<SendOutlined />}
                  loading={isCurrentUpdating}
                  onClick={() => handleQuickAdvance(record, "SHIPPING")}
                >
                  Giao hàng
                </Button>
              </Tooltip>
            )}

            {record.status === "SHIPPING" && (
              <Tooltip title="Xác nhận đã giao thành công">
                <Button
                  type="primary"
                  size="small"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  icon={<CheckCircleOutlined />}
                  loading={isCurrentUpdating}
                  onClick={() =>
                    handleQuickAdvance(
                      record,
                      "DELIVERED",
                      record.paymentStatus === "UNPAID" ? "PAID" : undefined,
                    )
                  }
                >
                  Hoàn tất
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert
          title="Lỗi tải danh sách đơn hàng"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Thanh công cụ và bộ lọc */}
      <Card size="small" className="shadow-sm">
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Tìm theo mã đơn (ORD-...)"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onPressEnter={handleSearch}
                  allowClear
                />
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="Trạng thái đơn"
                  allowClear
                  className="w-full"
                  value={selectedStatus}
                  onChange={(val) => setSelectedStatus(val)}
                  options={[
                    { value: "PENDING", label: "Chờ xác nhận" },
                    { value: "CONFIRMED", label: "Đã xác nhận" },
                    { value: "SHIPPING", label: "Đang giao hàng" },
                    { value: "DELIVERED", label: "Giao thành công" },
                    { value: "CANCELLED", label: "Đã hủy" },
                  ]}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="Thanh toán"
                  allowClear
                  className="w-full"
                  value={selectedPaymentStatus}
                  onChange={(val) => setSelectedPaymentStatus(val)}
                  options={[
                    { value: "PAID", label: "Đã thanh toán" },
                    { value: "UNPAID", label: "Chưa thanh toán" },
                    { value: "REFUNDED", label: "Đã hoàn tiền" },
                  ]}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Space orientation="horizontal">
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
            <Button
              icon={<ReloadOutlined />}
              onClick={() => router.refresh()}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bảng danh sách đơn hàng */}
      <Card size="small" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          pagination={{
            current: paginationMeta.current,
            pageSize: paginationMeta.pageSize,
            total: paginationMeta.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
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

      {/* Drawer xem chi tiết đơn hàng */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrder(null);
        }}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
};

export default OrderTable;

