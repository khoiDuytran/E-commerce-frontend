export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "WHOKNOWSISM";

// Ảnh nền dùng chung cho trang chủ và các trang đăng nhập, đăng ký, xác thực
export const STORE_HERO_IMAGE =
  "https://cdn.hstatic.net/files/200000320785/file/anonyig.io_instagram_alcyus.arc_3990379036470914455_40724191325.jpg";

// Dùng chung một định dạng tiền cho mọi trang của cửa hàng
export const formatVnd = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} VND`;

// Cố định múi giờ để HTML từ server và trình duyệt hiển thị giống nhau
export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Đã yêu cầu hoàn hàng",
  RETURN_APPROVED: "Đã duyệt hoàn hàng",
  RETURN_RECEIVED: "Cửa hàng đã nhận hàng hoàn",
  RETURN_REJECTED: "Từ chối hoàn hàng",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Chờ duyệt",
  APPROVED: "Đã duyệt, chờ nhận hàng hoàn",
  RECEIVED: "Đã nhận hàng, chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  REJECTED: "Bị từ chối",
};

export const ORDER_TABS = [
  { key: "all", label: "Tất cả", statuses: [] },
  { key: "pending", label: "Chờ xác nhận", statuses: ["PENDING"] },
  { key: "confirmed", label: "Đã xác nhận", statuses: ["CONFIRMED"] },
  { key: "shipping", label: "Đang giao", statuses: ["SHIPPING"] },
  { key: "delivered", label: "Đã giao", statuses: ["DELIVERED"] },
  {
    key: "return",
    label: "Hoàn hàng",
    statuses: [
      "RETURN_REQUESTED",
      "RETURN_APPROVED",
      "RETURN_RECEIVED",
      "RETURN_REJECTED",
      "REFUNDED",
    ],
  },
  { key: "cancelled", label: "Đã hủy", statuses: ["CANCELLED"] },
];

// Sản phẩm thường gắn ở danh mục con nên danh mục cha phải gồm cả cây con
export const getCategoryTreeIds = (
  categories: IStoreCategory[],
  rootId: string,
) => {
  const ids = new Set([rootId]);
  for (const id of ids) {
    categories
      .filter((category) => category.parentId === id)
      .forEach((category) => ids.add(category._id));
  }
  return [...ids];
};

export const getCouponDiscount = (
  coupon: IStoreCoupon | null,
  subtotal: number,
) => {
  if (!coupon || subtotal < (coupon.minOrderValue ?? 0)) return 0;
  const discount =
    coupon.discountType === "PERCENT"
      ? Math.min(
        (subtotal * coupon.discountValue) / 100,
        coupon.maxDiscount ?? subtotal,
      )
      : Math.min(
        coupon.discountValue,
        coupon.maxDiscount ?? coupon.discountValue,
      );
  return Math.round(discount);
};

export const toErrorText = (
  message: unknown,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
) => {
  if (Array.isArray(message)) return message.join(", ") || fallback;
  return typeof message === "string" && message ? message : fallback;
};
