import { sendRequest } from "@/utils/api";
import { getAuthHeader } from "@/utils/session";
import StatCards from "./stat.cards";

const COLOR = {
  success: "#52c41a",
  warning: "#faad14",
  danger: "#ff4d4f",
  info: "#1677ff",
};

// Thẻ thống kê chỉ là phần phụ: lỗi thì ẩn thẻ, không làm hỏng bảng.
// Dùng chung tag với danh sách để thẻ cập nhật cùng lúc khi dữ liệu thay đổi
const getStats = async <T,>(path: string, tag: string) => {
  try {
    const res = await sendRequest<IBackendRes<T>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${path}`,
      method: "GET",
      headers: await getAuthHeader(),
      nextOption: { next: { tags: [tag] } },
    });
    return res?.data ?? null;
  } catch {
    return null;
  }
};

export const UserStats = async () => {
  const stats = await getStats<IUserStats>("users/stats", "list-users");
  if (!stats) return null;
  return (
    <StatCards
      cards={[
        {
          title: "Tổng người dùng",
          value: stats.total,
          icon: "Team",
          note: `+${stats.newThisMonth} trong tháng này`,
        },
        {
          title: "Quản trị viên",
          value: stats.admins,
          icon: "Crown",
        },
        {
          title: "Đang hoạt động",
          value: stats.active,
          icon: "CheckCircle",
          color: COLOR.success,
        },
        {
          title: "Chưa kích hoạt",
          value: stats.unverified,
          icon: "ClockCircle",
          color: COLOR.warning,
          note: "Chưa xác thực email",
        },
        {
          title: "Bị vô hiệu hóa",
          value: stats.disabled,
          icon: "Stop",
          color: COLOR.danger,
        },
      ]}
    />
  );
};

export const CategoryStats = async () => {
  const stats = await getStats<ICategoryStats>(
    "category/stats",
    "list-categories",
  );
  if (!stats) return null;
  return (
    <StatCards
      cards={[
        {
          title: "Tổng danh mục",
          value: stats.total,
          icon: "Appstore",
        },
        {
          title: "Đang hiển thị",
          value: stats.active,
          icon: "Eye",
          color: COLOR.success,
        },
        {
          title: "Đang ẩn",
          value: stats.hidden,
          icon: "EyeInvisible",
          color: COLOR.warning,
        },
        { title: "Danh mục gốc", value: stats.root, icon: "Folder" },
        {
          title: "Danh mục con",
          value: stats.children,
          icon: "Partition",
        },
      ]}
    />
  );
};

export const CouponStats = async () => {
  const stats = await getStats<ICouponStats>("coupon/stats", "list-coupons");
  if (!stats) return null;
  return (
    <StatCards
      cards={[
        {
          title: "Tổng mã giảm giá",
          value: stats.total,
          icon: "Gift",
        },
        {
          title: "Đang chạy",
          value: stats.running,
          icon: "CheckCircle",
          color: COLOR.success,
          note: "Đang bật, còn hạn và còn lượt",
        },
        {
          title: "Sắp diễn ra",
          value: stats.upcoming,
          icon: "ClockCircle",
          color: COLOR.info,
        },
        {
          title: "Hết hạn / hết lượt",
          value: stats.ended,
          icon: "CloseCircle",
          color: COLOR.danger,
        },
        {
          title: "Lượt đã dùng",
          value: stats.used,
          icon: "Fire",
        },
      ]}
    />
  );
};

export const OrderStats = async () => {
  const stats = await getStats<IOrderStats>("orders/stats", "list-orders");
  if (!stats) return null;
  return (
    <StatCards
      cards={[
        {
          title: "Tổng đơn hàng",
          value: stats.total,
          icon: "ShoppingCart",
          note: `+${stats.today} đơn hôm nay`,
        },
        {
          title: "Chờ xác nhận",
          value: stats.pending,
          icon: "ClockCircle",
          color: COLOR.warning,
        },
        {
          title: "Đang xử lý / giao",
          value: stats.processing,
          icon: "Car",
          color: COLOR.info,
        },
        {
          title: "Đã giao",
          value: stats.delivered,
          icon: "CheckCircle",
          color: COLOR.success,
        },
        {
          title: "Hủy / trả hàng",
          value: stats.cancelled + stats.returns,
          icon: "Rollback",
          color: COLOR.danger,
          note: `${stats.cancelled} hủy · ${stats.returns} trả hàng`,
        },
        {
          title: "Doanh thu",
          value: stats.revenue,
          icon: "Dollar",
          currency: true,
          note: "Đơn đã giao hoặc đã thanh toán",
        },
      ]}
    />
  );
};

export const ProductStats = async () => {
  const stats = await getStats<IProductStats>("product/stats", "list-products");
  if (!stats) return null;
  return (
    <StatCards
      cards={[
        {
          title: "Tổng sản phẩm",
          value: stats.total,
          icon: "Shopping",
        },
        {
          title: "Đang bán",
          value: stats.active,
          icon: "Eye",
          color: COLOR.success,
          note: `${stats.hidden} sản phẩm đang ẩn`,
        },
        {
          title: "Sắp hết hàng",
          value: stats.lowStock,
          icon: "Warning",
          color: COLOR.warning,
          note: `Còn từ 1 đến ${stats.lowStockThreshold} sản phẩm`,
        },
        {
          title: "Hết hàng",
          value: stats.outOfStock,
          icon: "Inbox",
          color: COLOR.danger,
        },
        {
          title: "Đã bán",
          value: stats.sold,
          icon: "Fire",
          note: "Tổng số lượng bán ra",
        },
      ]}
    />
  );
};
