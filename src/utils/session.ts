import { auth } from "@/auth";

// Chỉ gọi phía server. Proxy đã làm mới token trước khi request tới đây,
// trừ trang chủ (xem matcher trong proxy.ts).
export const getSessionToken = async () => (await auth())?.access_token;

export const getAuthHeader = async (): Promise<Record<string, string>> => {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
