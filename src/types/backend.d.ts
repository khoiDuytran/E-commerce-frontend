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
  }

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
}
