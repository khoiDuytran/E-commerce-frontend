"use client";

import { useNotifications } from "@/library/notifications";
import {
  disablePush,
  enablePush,
  getPushState,
  PushState,
} from "@/library/web.push";
import { formatDateTime } from "@/utils/store";
import { BellOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Empty,
  Listy,
  message,
  Popover,
  Spin,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PUSH_HINTS: Partial<Record<PushState, string>> = {
  unsupported: "Trình duyệt không hỗ trợ thông báo",
  unavailable: "Backend chưa cấu hình VAPID cho Web Push",
  denied: "Thông báo đã bị chặn trong cài đặt trình duyệt",
};

const AdminNotificationBell = () => {
  const router = useRouter();
  const { items, unreadCount, isLoading, hasMore, markRead, markAllRead, loadMore } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [isPushBusy, setIsPushBusy] = useState(false);

  useEffect(() => {
    getPushState()
      .then(setPushState)
      .catch(() => setPushState("unsupported"));
  }, []);

  const onOpenItem = (item: INotification) => {
    void markRead(item._id);
    setIsOpen(false);
    if (item.link?.startsWith("/")) router.push(item.link);
  };

  const onTogglePush = async () => {
    setIsPushBusy(true);
    try {
      const next =
        pushState === "on" ? await disablePush() : await enablePush();
      setPushState(next);
      if (PUSH_HINTS[next]) message.warning(PUSH_HINTS[next]);
    } catch {
      message.error("Không bật được thông báo trình duyệt");
    } finally {
      setIsPushBusy(false);
    }
  };

  const content = (
    <div className="w-[min(24rem,calc(100vw-2rem))]">
      <div className="mb-2 flex items-center justify-between">
        <Typography.Text strong>Thông báo</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={() => void markAllRead()}>
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      {/* Listy thay cho List (đã deprecated từ antd 6.6) nhưng không có sẵn
          trạng thái loading và rỗng, nên tự hiển thị hai trạng thái này */}
      {items.length === 0 ? (
        isLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thông báo"
          />
        )
      ) : (
        <Listy<INotification>
          items={items}
          rowKey="_id"
          virtual={false}
          className="max-h-96 overflow-y-auto"
          itemRender={(item) => (
            <button
              type="button"
              onClick={() => onOpenItem(item)}
              className={`block w-full cursor-pointer border-b border-neutral-100 px-2 py-3 text-left hover:bg-neutral-50 ${item.isRead ? "" : "bg-blue-50/60"}`}
            >
              <Badge dot={!item.isRead} offset={[6, 0]}>
                <span className="font-medium">{item.title}</span>
                {!item.isRead && <span className="sr-only"> (chưa đọc)</span>}
              </Badge>
              <div className="mt-1 text-neutral-700">{item.message}</div>
              <div className="mt-1 text-xs text-neutral-400">
                {formatDateTime(item.createdAt)}
              </div>
            </button>
          )}
        />
      )}

      <div className="mt-2 flex items-center justify-between">
        {hasMore ? (
          <Button size="small" loading={isLoading} onClick={loadMore}>
            Xem thêm
          </Button>
        ) : (
          <span />
        )}
        {(pushState === "on" || pushState === "off") && (
          <Button
            type="link"
            size="small"
            loading={isPushBusy}
            onClick={() => void onTogglePush()}
          >
            {pushState === "on"
              ? "Tắt thông báo trình duyệt"
              : "Bật thông báo trình duyệt"}
          </Button>
        )}
        {pushState && PUSH_HINTS[pushState] && (
          <Typography.Text type="secondary" className="text-xs">
            {PUSH_HINTS[pushState]}
          </Typography.Text>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Button
        type="text"
        size="medium"
        aria-label={
          unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"
        }
        icon={
          <Badge count={unreadCount} overflowCount={99}>
            <BellOutlined style={{ fontSize: 18 }} />
          </Badge>
        }
      />
    </Popover>
  );
};

export default AdminNotificationBell;
