"use client";

import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/utils/actions";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

const PAGE_SIZE = 10;
const MIN_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

/**
 * Lấy vé mở socket qua route handler thay vì server action: route này luôn đi qua
 * proxy nên access token được làm mới trước, kể cả khi đang ở trang chủ.
 */
const fetchTicket = async (): Promise<string | "signed-out" | null> => {
  try {
    const res = await fetch("/session/socket-ticket", {
      method: "POST",
      cache: "no-store",
    });
    if (res.status === 401) return "signed-out";
    const data: { ticket?: string | null } = await res.json();
    return data.ticket ?? null;
  } catch {
    return null;
  }
};

/**
 * Thông báo của user đang đăng nhập: tải danh sách qua server action và nhận
 * thông báo mới qua WebSocket. Socket mở bằng vé ngắn hạn (sống 60 giây, chỉ mở
 * được socket) nên access token không xuống trình duyệt. Khi server ngắt vì phiên
 * hết hạn, hook xin vé mới (proxy làm mới token trước) rồi kết nối lại.
 */
export const useNotifications = () => {
  const [items, setItems] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  // Đúng ngay từ đầu vì effect tải trang 1 khi mount
  const [isLoading, setIsLoading] = useState(true);

  const applyPage = useCallback(
    (current: number, data: INotificationPage | null) => {
      setIsLoading(false);
      // null: lỗi mạng, giữ danh sách hiện có; lần kết nối lại sẽ tải lại
      if (!data) return;
      setItems((previous) => {
        if (current === 1) return data.results;
        const known = new Set(previous.map((item) => item._id));
        return [
          ...previous,
          ...data.results.filter((item) => !known.has(item._id)),
        ];
      });
      setUnreadCount(data.unreadCount);
      setPage(current);
      setPages(Math.max(data.meta.pages, 1));
    },
    [],
  );

  // setState chỉ nằm trong callback của promise nên gọi được từ effect
  const loadPage = useCallback(
    (current: number) =>
      getNotificationsAction(current, PAGE_SIZE)
        .catch(() => null)
        .then((data) => applyPage(current, data)),
    [applyPage],
  );

  useEffect(() => {
    let stopped = false;
    let retryDelay = MIN_RETRY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications`, {
      transports: ["websocket"],
      autoConnect: false,
      // Được gọi trước mỗi lần kết nối, kể cả khi thư viện tự kết nối lại
      auth: (callback) => {
        void fetchTicket().then((result) => {
          if (result === "signed-out") {
            // Đã đăng xuất hoặc không làm mới được phiên: dừng hẳn
            stopped = true;
            socket.disconnect();
            return;
          }
          // Lỗi tạm thời: server từ chối vé rỗng, nhánh disconnect bên dưới sẽ thử lại
          callback({ token: result ?? "" });
        });
      },
    });

    socket.on("connect", () => {
      retryDelay = MIN_RETRY_MS;
      // Tải lại sau mỗi lần kết nối: bù thông báo lỡ khi mất kết nối, và lúc này
      // phiên đã được làm mới nên lần tải đầu (nếu lỗi vì token hết hạn) được bù lại
      void loadPage(1);
    });

    socket.on("notification", (notification: INotification) => {
      setItems((previous) =>
        previous.some((item) => item._id === notification._id)
          ? previous
          : [notification, ...previous],
      );
      setUnreadCount((count) => count + 1);
    });

    socket.on("disconnect", (reason) => {
      // Server chủ động ngắt (token hết hạn): thư viện không tự kết nối lại
      if (reason !== "io server disconnect" || stopped) return;
      retryTimer = setTimeout(() => {
        if (!stopped) socket.connect();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
    });

    void loadPage(1);
    socket.connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [loadPage]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item._id === id);
      if (!target || target.isRead) return;
      setItems((previous) =>
        previous.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(count - 1, 0));
      await markNotificationReadAction(id).catch(() => false);
    },
    [items],
  );

  const markAllRead = useCallback(async () => {
    const ok = await markAllNotificationsReadAction().catch(() => false);
    if (!ok) return;
    setItems((previous) => previous.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading || page >= pages) return;
    setIsLoading(true);
    void loadPage(page + 1);
  }, [isLoading, loadPage, page, pages]);

  return {
    items,
    unreadCount,
    isLoading,
    hasMore: page < pages,
    markRead,
    markAllRead,
    loadMore,
  };
};
