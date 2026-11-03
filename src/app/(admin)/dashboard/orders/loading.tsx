import { Skeleton } from "antd";

const OrdersLoading = () => (
  <div aria-label="Đang tải danh sách đơn hàng" className="p-4">
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

export default OrdersLoading;

