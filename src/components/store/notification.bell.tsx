"use client";

import { useNotifications } from "@/library/notifications";
import {
  disablePush,
  enablePush,
  getPushState,
  PushState,
} from "@/library/web.push";
import { formatDateTime } from "@/utils/store";
import { BellIcon, IconBadge } from "./store.icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PUSH_LABELS: Record<PushState, string> = {
  unsupported: "Trình duyệt không hỗ trợ thông báo",
  unavailable: "Thông báo trình duyệt chưa được bật trên cửa hàng",
  denied: "Bạn đã chặn thông báo. Mở cài đặt trang web để cho phép lại",
  off: "Bật thông báo trình duyệt",
  on: "Tắt thông báo trình duyệt",
};

const NotificationBell = () => {
  const router = useRouter();
  const { items, unreadCount, isLoading, hasMore, markRead, markAllRead, loadMore } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [isPushBusy, setIsPushBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPushState()
      .then(setPushState)
      .catch(() => setPushState("unsupported"));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const onOpenItem = (item: INotification) => {
    void markRead(item._id);
    setIsOpen(false);
    if (item.link?.startsWith("/")) router.push(item.link);
  };

  const onTogglePush = async () => {
    if (pushState !== "on" && pushState !== "off") return;
    setIsPushBusy(true);
    try {
      setPushState(pushState === "on" ? await disablePush() : await enablePush());
    } catch {
      setPushState(await getPushState().catch(() => "off" as const));
    } finally {
      setIsPushBusy(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={
          unreadCount > 0
            ? `Thông báo, ${unreadCount} chưa đọc`
            : "Thông báo"
        }
        className="relative flex cursor-pointer items-center transition-opacity hover:opacity-50"
      >
        <BellIcon />
        <IconBadge count={unreadCount} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="absolute top-full right-0 z-40 mt-3 w-[min(22rem,calc(100vw-2rem))] border border-neutral-200 bg-white text-black shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="cursor-pointer text-neutral-600 hover:underline"
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && !isLoading && (
              <li className="px-4 py-10 text-center text-neutral-600">
                Chưa có thông báo nào.
              </li>
            )}
            {items.map((item) => (
              <li key={item._id} className="border-b border-neutral-100">
                <button
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="flex w-full cursor-pointer gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-black"
                      }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block ${item.isRead ? "" : "font-medium"}`}>
                      {item.title}
                      {!item.isRead && <span className="sr-only"> (chưa đọc)</span>}
                    </span>
                    <span className="mt-0.5 block text-neutral-600">
                      {item.message}
                    </span>
                    <span className="mt-1 block text-[11px] text-neutral-500">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {isLoading && (
              <li className="px-4 py-3 text-center text-neutral-500">
                Đang tải...
              </li>
            )}
          </ul>

          {hasMore && !isLoading && (
            <button
              type="button"
              onClick={loadMore}
              className="block w-full cursor-pointer border-b border-neutral-200 px-4 py-3 text-center hover:underline"
            >
              Xem thêm
            </button>
          )}

          {pushState && (
            <div className="px-4 py-3 text-neutral-600">
              {pushState === "on" || pushState === "off" ? (
                <button
                  type="button"
                  onClick={() => void onTogglePush()}
                  disabled={isPushBusy}
                  className="cursor-pointer hover:underline disabled:cursor-wait disabled:opacity-50"
                >
                  {PUSH_LABELS[pushState]}
                </button>
              ) : (
                <span>{PUSH_LABELS[pushState]}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
