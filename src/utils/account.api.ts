import { getSessionToken } from "./session";
import { redirect } from "next/navigation";
import { sendRequest } from "./api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const requireToken = async (callbackPath: string) => {
  const token = await getSessionToken();
  if (!token) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return token;
};

// Trả null khi backend lỗi để trang hiển thị thông báo thay vì hỏng cả trang
const fetchData = async <T>(path: string, token: string, queryParams = {}) => {
  try {
    const res = await sendRequest<IBackendRes<T>>({
      url: `${BACKEND_URL}/api/${path}`,
      method: "GET",
      queryParams,
      headers: { Authorization: `Bearer ${token}` },
      nextOption: { cache: "no-store" },
    });
    return res?.data ?? null;
  } catch {
    return null;
  }
};

// Chỉ giữ field cần hiển thị vì dữ liệu này được truyền xuống client component
const toOrder = (order: IStoreOrder): IStoreOrder => ({
  _id: order._id,
  orderCode: order.orderCode,
  items: order.items.map((item) => ({
    productName: item.productName,
    variantName: item.variantName,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
  })),
  shippingAddress: {
    fullName: order.shippingAddress.fullName,
    phone: order.shippingAddress.phone,
    province: order.shippingAddress.province,
    district: order.shippingAddress.district,
    ward: order.shippingAddress.ward,
    detail: order.shippingAddress.detail,
  },
  subtotal: order.subtotal,
  discount: order.discount,
  shippingFee: order.shippingFee,
  total: order.total,
  status: order.status,
  paymentStatus: order.paymentStatus,
  note: order.note,
  createdAt: order.createdAt,
});

export const getMyProfile = async (token: string) => {
  const data = await fetchData<{ user: IStoreProfile }>("users/me", token);
  return data?.user ?? null;
};

export const getMyAddresses = async (token: string) => {
  const data = await fetchData<{ results: IStoreAddress[] }>(
    "addresses",
    token,
  );
  return data?.results ?? null;
};

export const getMyOrders = async (token: string, query: object) => {
  const data = await fetchData<{ results: IStoreOrder[]; meta: IPageMeta }>(
    "orders",
    token,
    query,
  );
  return data ? { results: data.results.map(toOrder), meta: data.meta } : null;
};

export const getMyOrderByCode = async (token: string, orderCode: string) => {
  const data = await fetchData<IStoreOrder>(
    `orders/code/${encodeURIComponent(orderCode)}`,
    token,
  );
  return data?._id ? toOrder(data) : null;
};

export const getMyRefunds = async (token: string, orderCodes: string[]) => {
  if (orderCodes.length === 0) return [];
  const data = await fetchData<{ results: IStoreRefund[] }>("refunds", token, {
    orderCode: orderCodes.join(","),
    pageSize: orderCodes.length,
  });
  return (data?.results ?? []).map(
    (refund): IStoreRefund => ({
      orderCode: refund.orderCode,
      status: refund.status,
      reason: refund.reason,
      description: refund.description,
      adminNote: refund.adminNote,
      refundAmount: refund.refundAmount,
      createdAt: refund.createdAt,
    }),
  );
};

// Chỉ giữ field cần hiển thị: payment còn chứa phản hồi thô của cổng thanh toán
export const getOrderPayment = async (token: string, orderId: string) => {
  const data = await fetchData<{
    payment: { _id: string; paymentMethod: string };
  }>(`payments/order/${encodeURIComponent(orderId)}`, token);
  return data?.payment
    ? { _id: data.payment._id, method: data.payment.paymentMethod }
    : null;
};

// Đơn còn mở và chưa thanh toán bằng VNPay thì khách được thanh toán lại
export const canRetryPayment = (order: IStoreOrder, method?: string | null) =>
  method === "VNPAY" &&
  order.paymentStatus === "UNPAID" &&
  order.status !== "CANCELLED" &&
  order.status !== "REFUNDED";

// Sản phẩm đã bị xoá được populate thành null; chỉ giữ field cần hiển thị
export const getMyWishlist = async (token: string) => {
  const data = await fetchData<{
    products: (IStoreWishlistItem | null)[];
  }>("wishlist", token);
  if (!data) return null;
  return data.products
    .filter((product) => product !== null)
    .map(
      (product): IStoreWishlistItem => ({
        _id: String(product._id),
        name: product.name,
        slug: product.slug,
        images: product.images ?? [],
        basePrice: product.basePrice,
        originalPrice: product.originalPrice,
        stock: product.stock,
        isActive: product.isActive,
      }),
    );
};
