"use server";
import { auth, signIn } from "@/auth";
import { sendRequest, sendRequestFile } from "./api";
import { getAuthHeader } from "./session";
import { updateTag } from "next/cache";
import {
  DisabledAccountError,
  InactiveAccountError,
  InvalidEmailPasswordError,
} from "./errors";

export async function authenticate(username: string, password: string) {
  try {
    const res = await signIn("credentials", {
      username: username,
      password: password,
      redirect: false,
    });
    return res;
  } catch (error) {
    // So theo type vì tên class bị đổi khi minify ở bản production
    const { type } = error as { type?: string };
    if (type === InvalidEmailPasswordError.type) {
      return {
        error: type,
        code: 1,
      };
    } else if (type === InactiveAccountError.type) {
      return {
        error: type,
        code: 2,
      };
    } else if (type === DisabledAccountError.type) {
      return {
        error: type,
        code: 3,
      };
    } else {
      return {
        error: "Internal server error",
        code: 0,
      };
    }
  }
}

// ================= USER ACTIONS =================
interface UserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export const handleCreateUserAction = async (data: UserPayload) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ user: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
    method: "POST",
    headers: authHeader,
    body: { ...data },
  });
  updateTag("list-users");
  return res;
};

export const handleUpdateUserAction = async (data: {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
}) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ user: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
    method: "PATCH",
    headers: authHeader,
    body: { ...data },
  });
  updateTag("list-users");
  return res;
};

export const handleDeleteUserAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${id}`,
    method: "DELETE",
    headers: authHeader,
  });

  updateTag("list-users");
  return res;
};

export const handleUpdateUserStatusAction = async (
  id: string,
  isDisabled: boolean,
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ user: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/status`,
    method: "PATCH",
    headers: authHeader,
    body: { _id: id, isDisabled },
  });
  updateTag("list-users");
  return res;
};

// ================= CATEGORY ACTIONS =================
interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string | null;
  isActive?: boolean;
}

export const handleCreateCategoryAction = async (data: CategoryData) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ category: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
  updateTag("list-categories");
  return res;
};

export const handleUpdateCategoryAction = async (
  data: CategoryData & { _id: string },
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ category: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
  updateTag("list-categories");
  return res;
};

export const handleDeleteCategoryAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag("list-categories");
  return res;
};

// ================= COUPON ACTIONS =================
interface CouponData {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export const handleCreateCouponAction = async (data: CouponData) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ coupon: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
  updateTag("list-coupons");
  return res;
};

export const handleUpdateCouponAction = async (
  data: CouponData & { _id: string },
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ coupon: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
  updateTag("list-coupons");
  return res;
};

export const handleDeleteCouponAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag("list-coupons");
  return res;
};

// ================= MEDIA ACTIONS =================
export const handleUploadImageAction = async (formData: FormData) => {
  const authHeader = await getAuthHeader();
  return sendRequestFile<IBackendRes<{ url: string }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cloudinary/images`,
    method: "POST",
    headers: authHeader,
    body: formData,
  });
};

export const handleDeleteImagesAction = async (urls: string[]) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ deleted: string[] }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cloudinary/images`,
    method: "DELETE",
    headers: authHeader,
    body: { urls },
  });
};

// Chữ ký để trình duyệt tải video thẳng lên Cloudinary, không qua server action
export interface VideoUploadSignature {
  uploadUrl: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  public_id: string;
  allowed_formats: string;
}

export const handleGetVideoUploadSignatureAction = async () => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<VideoUploadSignature>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cloudinary/videos/signature`,
    method: "POST",
    headers: authHeader,
  });
};

// ================= BANNER ACTIONS =================
interface BannerData {
  title: string;
  mediaType: IBannerMediaType;
  mediaUrl: string;
  link?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const handleCreateBannerAction = async (data: BannerData) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ banner: IBannerRecord }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/banner`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
  updateTag("list-banners");
  return res;
};

export const handleUpdateBannerAction = async (
  data: Partial<BannerData> & { _id: string },
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ banner: IBannerRecord }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/banner`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
  updateTag("list-banners");
  return res;
};

export const handleDeleteBannerAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/banner/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag("list-banners");
  return res;
};

// ================= PRODUCT ACTIONS =================
export interface ProductPayload {
  name: string;
  slug: string;
  description?: string;
  sizeGuide?: string;
  detailsFit?: string;
  category: string;
  images?: string[];
  // Giá bán
  basePrice: number;
  // Giá trước giảm; null khi sửa để xoá
  originalPrice?: number | null;
  // Giá nhập, chỉ admin thấy; null khi sửa để xoá
  costPrice?: number | null;
  tags?: string[];
  // Bỏ trống khi sản phẩm có biến thể: backend tự tính từ tổng các biến thể
  stock?: number;
  isActive?: boolean;
}

export const handleCreateProductAction = async (data: ProductPayload) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ product: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
  updateTag("list-products");
  return res;
};

export const handleUpdateProductAction = async (
  data: Partial<ProductPayload> & { _id: string },
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ product: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
  updateTag("list-products");
  return res;
};

export const handleDeleteProductAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag("list-products");
  return res;
};

// ================= PRODUCT VARIANT ACTIONS =================
export interface VariantPayload {
  product: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  // Giá bán
  price: number;
  // Giá trước giảm; null khi sửa để xoá
  originalPrice?: number | null;
  // Giá nhập, chỉ admin thấy; null khi sửa để xoá
  costPrice?: number | null;
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

export const handleGetVariantsByProductAction = async (productId: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<
    IBackendRes<{ results: unknown[]; meta: IPageMeta }>
  >({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product-variants/admin/all`,
    method: "GET",
    queryParams: {
      product: productId,
      pageSize: 100,
    },
    headers: authHeader,
    nextOption: {
      next: { tags: [`product-variants-${productId}`] },
    },
  });
  return res;
};

export const handleCreateVariantAction = async (data: VariantPayload) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ variant: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product-variants`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
  updateTag(`product-variants-${data.product}`);
  updateTag("list-products");
  return res;
};

export const handleUpdateVariantAction = async (
  data: Partial<VariantPayload> & { _id: string; product: string },
) => {
  const authHeader = await getAuthHeader();
  // product chỉ dùng để làm mới cache: DTO update của backend không nhận field này
  const { product, ...body } = data;
  const res = await sendRequest<IBackendRes<{ variant: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product-variants`,
    method: "PATCH",
    headers: authHeader,
    body,
  });
  updateTag(`product-variants-${product}`);
  updateTag("list-products");
  return res;
};

export const handleDeleteVariantAction = async (
  id: string,
  productId: string,
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product-variants/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag(`product-variants-${productId}`);
  updateTag("list-products");
  return res;
};

// ================= ORDER ACTIONS =================
export interface UpdateOrderPayload {
  _id: string;
  status?: string;
  paymentStatus?: string;
  note?: string;
}

export const handleUpdateOrderAction = async (data: UpdateOrderPayload) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ order: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
  updateTag("list-orders");
  return res;
};

export const handleCancelOrderAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<{ order: unknown }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/cancel/${encodeURIComponent(id)}`,
    method: "PATCH",
    headers: authHeader,
  });
  updateTag("list-orders");
  return res;
};

export const handleGetOrderDetailAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${encodeURIComponent(id)}`,
    method: "GET",
    headers: authHeader,
  });
  return res;
};

export const handleDeleteOrderAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
  updateTag("list-orders");
  return res;
};

// ================= STOREFRONT ACTIONS =================
export const handleLookupCouponAction = async (
  rawCode: string,
): Promise<{ coupon?: IStoreCoupon; error?: string }> => {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,50}$/.test(code)) {
    return { error: "Mã giảm giá không hợp lệ" };
  }

  const authHeader = await getAuthHeader();
  // Backend chỉ trả mã còn dùng được, kèm các field cần để tính thử số tiền giảm
  const res = await sendRequest<IBackendRes<IStoreCoupon>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/lookup`,
    method: "GET",
    queryParams: { code },
    headers: authHeader,
    nextOption: { cache: "no-store" },
  });

  if (!res?.data?._id) {
    return { error: "Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng" };
  }

  return { coupon: res.data };
};

// ================= ACCOUNT ACTIONS =================
export const handleUpdateProfileAction = async (data: {
  name: string;
  phone: string;
  address: string;
}) => {
  const session = await auth();
  const authHeader = await getAuthHeader();
  // Lấy id từ phiên đăng nhập: admin được phép sửa theo _id nên không nhận id từ client
  return sendRequest<IBackendRes<{ user: IStoreProfile }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
    method: "PATCH",
    headers: authHeader,
    body: { _id: session?.user?._id, ...data },
  });
};

// Backend kiểm tra email khớp tài khoản đang đăng nhập rồi gửi mã xác nhận
export const handleRequestDisableCodeAction = async (email: string) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ email: string }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me/disable/code`,
    method: "POST",
    headers: authHeader,
    body: { email },
  });
};

// Backend thu hồi refresh token; client tự đăng xuất sau khi gọi thành công
export const handleDisableMyAccountAction = async (code: string) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me/disable`,
    method: "PATCH",
    headers: authHeader,
    body: { code },
  });
};

export const handleCreateAddressAction = async (
  data: IShippingAddress & { isDefault?: boolean },
) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ address: IStoreAddress }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addresses`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
};

export const handleUpdateAddressAction = async (
  data: IShippingAddress & { _id: string; isDefault?: boolean },
) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ address: IStoreAddress }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addresses`,
    method: "PATCH",
    headers: authHeader,
    body: data,
  });
};

export const handleDeleteAddressAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<unknown>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addresses/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeader,
  });
};

export const handleSetDefaultAddressAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ address: IStoreAddress }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addresses/${encodeURIComponent(id)}/default`,
    method: "PATCH",
    headers: authHeader,
  });
};

// Backend kiểm tra payment thuộc về user và đơn còn mở, rồi cấp lại link thanh toán
export const handleRetryPaymentAction = async (paymentId: string) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ paymentInfo?: { checkoutUrl: string } }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/${encodeURIComponent(paymentId)}/retry`,
    method: "POST",
    headers: authHeader,
  });
};

export const handleCreateRefundAction = async (data: {
  orderCode: string;
  reason: string;
  description?: string;
}) => {
  const authHeader = await getAuthHeader();
  return sendRequest<IBackendRes<{ _id: string }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/refunds`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
};

interface StoreOrderPayload {
  items: Array<{ product: string; variant?: string; quantity: number }>;
  addressId: string;
  paymentMethod: "COD" | "VNPAY";
  coupon?: string;
  note?: string;
}

export const handleCreateOrderAction = async (data: StoreOrderPayload) => {
  const authHeader = await getAuthHeader();
  return sendRequest<
    IBackendRes<{
      order: { orderCode: string; total: number };
      payment: { paymentInfo?: { checkoutUrl: string } };
    }>
  >({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`,
    method: "POST",
    headers: authHeader,
    body: data,
  });
};

// ================= NOTIFICATION ACTIONS =================
// Vé mở WebSocket lấy qua route /session/socket-ticket, không qua server action
// (server action gửi từ trang chủ không đi qua proxy nên không làm mới token).

const NOTIFICATION_API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications`;

export const getNotificationsAction = async (current = 1, pageSize = 10) => {
  const authHeader = await getAuthHeader();
  if (!authHeader.Authorization) return null;
  const res = await sendRequest<IBackendRes<INotificationPage>>({
    url: NOTIFICATION_API,
    method: "GET",
    headers: authHeader,
    queryParams: { current, pageSize },
    nextOption: { cache: "no-store" },
  });
  if (!res?.data) return null;
  const { meta, unreadCount, results } = res.data;
  return {
    meta,
    unreadCount,
    // Chỉ trả field hiển thị
    results: results.map(
      ({ _id, type, title, message, link, isRead, createdAt }) => ({
        _id,
        type,
        title,
        message,
        link,
        isRead,
        createdAt,
      }),
    ),
  } satisfies INotificationPage;
};

export const markNotificationReadAction = async (id: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${NOTIFICATION_API}/${encodeURIComponent(id)}/read`,
    method: "PATCH",
    headers: authHeader,
  });
  return !!res?.data;
};

export const markAllNotificationsReadAction = async () => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${NOTIFICATION_API}/read-all`,
    method: "PATCH",
    headers: authHeader,
  });
  return !!res?.data;
};

export const getPushPublicKeyAction = async () => {
  const res = await sendRequest<
    IBackendRes<{ enabled: boolean; publicKey: string | null }>
  >({
    url: `${NOTIFICATION_API}/push/public-key`,
    method: "GET",
  });
  return res?.data?.enabled ? res.data.publicKey : null;
};

export const subscribePushAction = async (
  subscription: IPushSubscriptionInput,
) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${NOTIFICATION_API}/push/subscriptions`,
    method: "POST",
    headers: authHeader,
    body: { endpoint: subscription.endpoint, keys: subscription.keys },
  });
  return !!res?.data;
};

export const unsubscribePushAction = async (endpoint: string) => {
  const authHeader = await getAuthHeader();
  const res = await sendRequest<IBackendRes<unknown>>({
    url: `${NOTIFICATION_API}/push/subscriptions`,
    method: "DELETE",
    headers: authHeader,
    body: { endpoint },
  });
  return !!res?.data;
};

// ================= WISHLIST ACTIONS =================

const WISHLIST_API = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wishlist`;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export type WishlistActionResult = "ok" | "signed-out" | "error";

const toWishlistResult = (statusCode: number | string | undefined) =>
  statusCode === 401 ? "signed-out" : "error";

/** Chỉ trả id sản phẩm để tô nút yêu thích; null khi chưa đăng nhập */
export const getWishlistIdsAction = async (): Promise<
  { ids: string[] } | { ids: null; reason: "signed-out" | "error" }
> => {
  const authHeader = await getAuthHeader();
  if (!authHeader.Authorization) return { ids: null, reason: "signed-out" };
  try {
    const res = await sendRequest<
      IBackendRes<{ products: ({ _id: string } | null)[] }>
    >({
      url: WISHLIST_API,
      method: "GET",
      headers: authHeader,
      nextOption: { cache: "no-store" },
    });
    if (!res?.data) {
      return { ids: null, reason: toWishlistResult(res?.statusCode) };
    }
    // Sản phẩm đã bị xoá được populate thành null
    return {
      ids: res.data.products
        .filter((product) => product !== null)
        .map((product) => String(product._id)),
    };
  } catch {
    return { ids: null, reason: "error" };
  }
};

export const addWishlistProductAction = async (
  productId: string,
): Promise<WishlistActionResult> => {
  if (!OBJECT_ID_PATTERN.test(productId)) return "error";
  const authHeader = await getAuthHeader();
  if (!authHeader.Authorization) return "signed-out";
  try {
    const res = await sendRequest<IBackendRes<unknown>>({
      url: `${WISHLIST_API}/products`,
      method: "POST",
      headers: authHeader,
      body: { product: productId },
    });
    return res?.data ? "ok" : toWishlistResult(res?.statusCode);
  } catch {
    return "error";
  }
};

export const removeWishlistProductAction = async (
  productId: string,
): Promise<WishlistActionResult> => {
  if (!OBJECT_ID_PATTERN.test(productId)) return "error";
  const authHeader = await getAuthHeader();
  if (!authHeader.Authorization) return "signed-out";
  try {
    const res = await sendRequest<IBackendRes<unknown>>({
      url: `${WISHLIST_API}/products/${productId}`,
      method: "DELETE",
      headers: authHeader,
    });
    // 404: sản phẩm vốn không còn trong danh sách, kết quả vẫn đúng ý người dùng
    if (res?.data || res?.statusCode === 404) return "ok";
    return toWishlistResult(res?.statusCode);
  } catch {
    return "error";
  }
};
