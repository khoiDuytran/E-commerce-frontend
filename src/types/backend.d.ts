export {};
// https://bobbyhadz.com/blog/typescript-make-types-global#declare-global-types-in-typescript

declare global {
  interface IRequest {
    url: string;
    method: string;
    body?: object;
    queryParams?: object;
    useCredentials?: boolean;
    headers?: Record<string, string>;
    nextOption?: RequestInit;
  }

  interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
  }

  interface IModelPaginate<T> {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    result: T[];
  }

  interface IPageMeta {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  }

  interface IUserRecord {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    address?: string;
    role?: UserRole;
    isActive?: boolean;
    isDisabled?: boolean;
  }

  interface IUserStats {
    total: number;
    admins: number;
    active: number;
    unverified: number;
    disabled: number;
    newThisMonth: number;
  }

  interface ICategoryStats {
    total: number;
    active: number;
    hidden: number;
    root: number;
    children: number;
  }

  interface ICouponStats {
    total: number;
    running: number;
    upcoming: number;
    ended: number;
    used: number;
  }

  interface IOrderStats {
    total: number;
    today: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    returns: number;
    revenue: number;
  }

  interface IProductStats {
    total: number;
    active: number;
    hidden: number;
    lowStock: number;
    outOfStock: number;
    lowStockThreshold: number;
    sold: number;
  }

  type UserRole = "ADMIN" | "USER";

  interface ILogin {
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    access_token: string;
  }

  interface INotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    // Đường dẫn tương đối trên frontend, backend tạo theo loại thông báo
    link?: string;
    isRead: boolean;
    createdAt: string;
  }

  interface INotificationPage {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    unreadCount: number;
    results: INotification[];
  }

  // Dạng PushSubscription.toJSON() của trình duyệt
  interface IPushSubscriptionInput {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  type IBannerMediaType = "image" | "video";

  // Banner trang chủ mà khách nhìn thấy (GET /banner/active)
  interface IStoreBanner {
    _id: string;
    title: string;
    mediaType: IBannerMediaType;
    mediaUrl: string;
    link?: string;
  }

  interface IBannerRecord extends IStoreBanner {
    sortOrder: number;
    isActive: boolean;
    createdAt?: string;
  }

  type RefundStatus =
    | "REQUESTED"
    | "APPROVED"
    | "RECEIVED"
    | "REFUNDED"
    | "REJECTED";

  // Yêu cầu hoàn hàng ở trang admin: orderId và userId đã được populate
  interface IRefundRecord {
    _id: string;
    orderCode: string;
    reason: string;
    description?: string;
    status: RefundStatus;
    refundAmount: number;
    adminNote?: string;
    refundedAt?: string;
    createdAt: string;
    // null khi đơn không còn tìm thấy payment (dữ liệu cũ)
    paymentMethod: "COD" | "VNPAY" | null;
    userId: { _id: string; name?: string; email: string } | null;
    orderId: {
      _id: string;
      status: string;
      total: number;
      shippingAddress?: { fullName: string; phone: string };
      items: {
        productName: string;
        variantName?: string;
        quantity: number;
        price: number;
      }[];
    } | null;
  }
}
