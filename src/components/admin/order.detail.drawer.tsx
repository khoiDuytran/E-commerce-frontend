"use client";

import {
  handleCancelOrderAction,
  handleUpdateOrderAction,
} from "@/utils/actions";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  SendOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Image,
  Popconfirm,
  Row,
  Space,
  Steps,
  Table,
  Tag,
  message,
  notification,
} from "antd";
import type { TableProps } from "antd";
import { useState } from "react";

export interface IOrderItem {
  product: string;
  variant?: string;
  productName: string;
  variantName?: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
}

export interface IOrder {
  _id: string;
  orderCode: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

interface IProps {
  order: IOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val || 0);
};

const getOrderStatusStep = (status: string) => {
  switch (status) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
      return 1;
    case "SHIPPING":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
};

const OrderDetailDrawer = ({
  order,
  isOpen,
  onClose,
  onRefresh,
}: IProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const currentStep = getOrderStatusStep(order.status);
  const isCancelled = order.status === "CANCELLED";
  const isRefunded = order.status === "REFUNDED";

  const handleAdvanceStatus = async (
    nextStatus: string,
    nextPaymentStatus?: string,
  ) => {
    setIsUpdating(true);
    try {
      const payload: {
        _id: string;
        status: string;
        paymentStatus?: string;
      } = {
        _id: order._id,
        status: nextStatus,
      };

      if (nextPaymentStatus) {
        payload.paymentStatus = nextPaymentStatus;
      }

      const res = await handleUpdateOrderAction(payload);
      if (res?.data) {
        message.success("Cập nhật trạng thái đơn hàng thành công!");
        onRefresh?.();
        onClose();
      } else {
        const errorMsg = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.message || "Cập nhật trạng thái thất bại";
        notification.error({
          message: "Lỗi cập nhật",
          description: errorMsg,
        });
      }
    } catch {
      message.error("Lỗi khi kết nối với máy chủ");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsUpdating(true);
    try {
      const res = await handleCancelOrderAction(order._id);
      if (res?.data) {
        message.success("Đã hủy đơn hàng và hoàn lại tồn kho thành công!");
        onRefresh?.();
        onClose();
      } else {
        const errorMsg = Array.isArray(res?.error)
          ? res.error.join(", ")
          : res?.message || "Hủy đơn hàng thất bại";
        notification.error({
          message: "Lỗi hủy đơn",
          description: errorMsg,
        });
      }
    } catch {
      message.error("Lỗi khi kết nối máy chủ");
    } finally {
      setIsUpdating(false);
    }
  };

  const itemColumns: TableProps<IOrderItem>["columns"] = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, item) => (
        <div className="flex items-center gap-3">
          <Image
            src={item.image}
            alt={item.productName}
            width={45}
            height={45}
            className="rounded object-cover border"
            fallback="https://via.placeholder.com/45?text=SP"
          />
          <div>
            <div className="font-medium text-sm text-gray-800">
              {item.productName}
            </div>
            {item.variantName && (
              <Tag color="cyan" className="mt-0.5 text-xs">
                {item.variantName}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (price: number) => formatCurrency(price),
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty: number) => <b>x{qty}</b>,
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right",
      render: (_, item) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(item.price * item.quantity)}
        </span>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center pr-6">
          <div>
            <span className="text-lg font-bold">Chi tiết đơn hàng: </span>
            <Tag color="blue" className="text-base font-mono font-semibold">
              {order.orderCode}
            </Tag>
          </div>
          <div className="text-xs text-gray-500 font-normal">
            Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
          </div>
        </div>
      }
      open={isOpen}
      onClose={onClose}
      size="large"
      extra={
        <Space orientation="horizontal">
          {order.status === "PENDING" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={isUpdating}
              onClick={() => handleAdvanceStatus("CONFIRMED")}
            >
              Xác nhận đơn
            </Button>
          )}

          {order.status === "CONFIRMED" && (
            <Button
              type="primary"
              className="bg-sky-600 hover:bg-sky-500"
              icon={<SendOutlined />}
              loading={isUpdating}
              onClick={() => handleAdvanceStatus("SHIPPING")}
            >
              Giao cho shipper
            </Button>
          )}

          {order.status === "SHIPPING" && (
            <Button
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-500"
              icon={<CheckCircleOutlined />}
              loading={isUpdating}
              onClick={() =>
                handleAdvanceStatus(
                  "DELIVERED",
                  order.paymentStatus === "UNPAID" ? "PAID" : undefined,
                )
              }
            >
              Đã giao thành công
            </Button>
          )}

          {(order.status === "PENDING" || order.status === "CONFIRMED") && (
            <Popconfirm
              title="Xác nhận hủy đơn hàng"
              description="Thao tác này sẽ hủy đơn và tự động hoàn trả số lượng hàng vào kho. Bạn có chắc chắn không?"
              okText="Hủy đơn"
              cancelText="Không"
              okButtonProps={{ danger: true, loading: isUpdating }}
              onConfirm={handleCancelOrder}
            >
              <Button danger icon={<CloseCircleOutlined />} loading={isUpdating}>
                Hủy đơn
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Tiến trình trạng thái */}
        {!isCancelled && !isRefunded && currentStep >= 0 && (
          <Card size="small" className="bg-slate-50 border-slate-200">
            <Steps
              current={currentStep}
              size="small"
              items={[
                {
                  title: "Chờ xác nhận",
                  icon: <ClockCircleOutlined />,
                },
                {
                  title: "Đã xác nhận",
                  icon: <CheckCircleOutlined />,
                },
                {
                  title: "Đang giao",
                  icon: <SendOutlined />,
                },
                {
                  title: "Đã giao",
                  icon: <CheckCircleOutlined />,
                },
              ]}
            />
          </Card>
        )}

        {isCancelled && (
          <Alert
            message="Đơn hàng đã bị hủy"
            description="Đơn hàng này đã bị hủy bỏ và tồn kho đã được hoàn trả lại cho hệ thống."
            type="error"
            showIcon
          />
        )}

        {isRefunded && (
          <Alert
            message="Đơn hàng đã được hoàn tiền"
            description="Đơn hàng đã hoàn tất quy trình hoàn hàng và hoàn tiền cho người mua."
            type="warning"
            showIcon
          />
        )}

        {/* Thông tin giao hàng & tài khoản */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card
              size="small"
              title={
                <span>
                  <EnvironmentOutlined className="mr-1.5 text-blue-500" />
                  Địa chỉ nhận hàng
                </span>
              }
              className="h-full border-blue-100"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Người nhận">
                  <b>{order.shippingAddress?.fullName}</b>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <a href={`tel:${order.shippingAddress?.phone}`}>
                    {order.shippingAddress?.phone}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {order.shippingAddress?.detail}, {order.shippingAddress?.ward},{" "}
                  {order.shippingAddress?.district},{" "}
                  {order.shippingAddress?.province}
                </Descriptions.Item>
                {order.note && (
                  <Descriptions.Item label="Ghi chú">
                    <span className="italic text-gray-600 font-medium">
                      &quot;{order.note}&quot;
                    </span>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          <Col span={12}>
            <Card
              size="small"
              title={
                <span>
                  <DollarCircleOutlined className="mr-1.5 text-emerald-500" />
                  Trạng thái thanh toán
                </span>
              }
              className="h-full border-emerald-100"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Thanh toán">
                  {order.paymentStatus === "PAID" ? (
                    <Tag color="success">Đã thanh toán</Tag>
                  ) : order.paymentStatus === "UNPAID" ? (
                    <Tag color="warning">Chưa thanh toán</Tag>
                  ) : (
                    <Tag color="purple">Đã hoàn tiền</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái đơn">
                  {order.status === "PENDING" && (
                    <Tag color="gold">Chờ xác nhận</Tag>
                  )}
                  {order.status === "CONFIRMED" && (
                    <Tag color="blue">Đã xác nhận</Tag>
                  )}
                  {order.status === "SHIPPING" && (
                    <Tag color="cyan">Đang giao hàng</Tag>
                  )}
                  {order.status === "DELIVERED" && (
                    <Tag color="green">Giao thành công</Tag>
                  )}
                  {order.status === "CANCELLED" && (
                    <Tag color="default">Đã hủy</Tag>
                  )}
                  {order.status.startsWith("RETURN") && (
                    <Tag color="magenta">{order.status}</Tag>
                  )}
                </Descriptions.Item>
                {order.user && (
                  <Descriptions.Item label="Tài khoản mua">
                    {order.user.name} ({order.user.email})
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Bảng sản phẩm */}
        <div>
          <div className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <ShoppingOutlined /> Danh sách sản phẩm đặt mua ({order.items.length})
          </div>
          <Table
            columns={itemColumns}
            // Item không có _id và cùng sản phẩm có thể lặp lại nên khóa gồm cả vị trí
            dataSource={order.items.map((item, index) => ({
              ...item,
              rowKey: `${item.product}-${index}`,
            }))}
            rowKey="rowKey"
            pagination={false}
            size="small"
            bordered
          />
        </div>

        {/* Tóm tắt số tiền */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-sm bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá khuyến mãi:</span>
                <span className="font-medium">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển:</span>
              <span className="font-medium text-gray-800">
                {order.shippingFee > 0
                  ? formatCurrency(order.shippingFee)
                  : "Miễn phí"}
              </span>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex justify-between items-center text-base font-bold">
              <span>Tổng thanh toán:</span>
              <span className="text-emerald-600 text-lg">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default OrderDetailDrawer;

