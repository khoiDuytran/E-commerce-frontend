"use client";

import {
  getPushPublicKeyAction,
  subscribePushAction,
  unsubscribePushAction,
} from "@/utils/actions";

/**
 * - unsupported: trình duyệt không hỗ trợ (hoặc không phải HTTPS/localhost)
 * - unavailable: backend chưa cấu hình VAPID
 * - denied: người dùng đã chặn quyền thông báo
 */
export type PushState =
  | "unsupported"
  | "unavailable"
  | "denied"
  | "off"
  | "on";

const SERVICE_WORKER_URL = "/sw.js";

const isSupported = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// Khoá VAPID dạng base64url -> mảng byte cho pushManager.subscribe
const toApplicationServerKey = (base64Url: string) => {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

const getRegistration = () =>
  navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);

const toInput = (subscription: PushSubscription): IPushSubscriptionInput => {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  };
};

export const getPushState = async (): Promise<PushState> => {
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const subscription = await (await getRegistration())?.pushManager
    .getSubscription()
    .catch(() => null);
  return subscription ? "on" : "off";
};

/** Phải gọi từ thao tác của người dùng (bấm nút) để trình duyệt cho hỏi quyền */
export const enablePush = async (): Promise<PushState> => {
  if (!isSupported()) return "unsupported";

  const publicKey = await getPushPublicKeyAction().catch(() => null);
  if (!publicKey) return "unavailable";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission === "denied" ? "denied" : "off";
  }

  const registration = await navigator.serviceWorker.register(
    SERVICE_WORKER_URL,
  );
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toApplicationServerKey(publicKey),
    }));

  const saved = await subscribePushAction(toInput(subscription)).catch(
    () => false,
  );
  if (!saved) {
    await subscription.unsubscribe();
    return "off";
  }
  return "on";
};

export const disablePush = async (): Promise<PushState> => {
  if (!isSupported()) return "unsupported";
  const subscription = await (
    await getRegistration()
  )?.pushManager.getSubscription();
  if (subscription) {
    await unsubscribePushAction(subscription.endpoint).catch(() => false);
    await subscription.unsubscribe();
  }
  return "off";
};

/**
 * Gỡ đăng ký push trước khi đăng xuất, để máy dùng chung không tiếp tục nhận
 * thông báo của tài khoản vừa thoát. Không chặn việc đăng xuất nếu lỗi.
 */
export const disablePushBeforeSignOut = async () => {
  try {
    await disablePush();
  } catch {
    // Bỏ qua: đăng xuất vẫn phải tiếp tục
  }
};
