// Refresh token của backend chỉ nằm trong JWT mã hoá của NextAuth phía server,
// không bao giờ đưa vào session trả về trình duyệt.

export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // giây, khớp JWT_REFRESH_TOKEN_EXPIRE

// Làm mới sớm để request đang chạy không bị token hết hạn giữa chừng
const REFRESH_BUFFER_MS = 60 * 1000;
// Giữ kết quả để các request song song dùng chung, vì backend xoay vòng token sau mỗi lần refresh
const REFRESH_RESULT_TTL_MS = 60 * 1000;

const REFRESH_COOKIE = "refresh_token";

export const readRefreshCookie = (res: Response) => {
  for (const cookie of res.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (pair.slice(0, separator).trim() === REFRESH_COOKIE) {
      return decodeURIComponent(pair.slice(separator + 1));
    }
  }
  return undefined;
};

const refreshCookieHeader = (refreshToken: string) => ({
  cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`,
});

export const isAccessTokenExpiring = (accessToken?: string) => {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken!.split(".")[1], "base64url").toString(),
    );
    return payload.exp * 1000 - Date.now() < REFRESH_BUFFER_MS;
  } catch {
    return true;
  }
};

export type RefreshResult =
  | { status: "ok"; accessToken: string; refreshToken: string }
  // Backend từ chối refresh token: phiên đã hết
  | { status: "invalid" }
  // Lỗi tạm thời (mất kết nối, backend lỗi): giữ nguyên phiên
  | { status: "unavailable" };

const callRefresh = async (refreshToken: string): Promise<RefreshResult> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh`,
      { method: "POST", headers: refreshCookieHeader(refreshToken) },
    );
    if (res.status === 401) return { status: "invalid" };
    if (!res.ok) return { status: "unavailable" };

    const json = await res.json();
    const accessToken = json?.data?.access_token;
    const newRefreshToken = readRefreshCookie(res);
    if (!accessToken || !newRefreshToken) return { status: "unavailable" };
    return { status: "ok", accessToken, refreshToken: newRefreshToken };
  } catch {
    return { status: "unavailable" };
  }
};

const inFlight = new Map<string, Promise<RefreshResult>>();

export const refreshBackendTokens = (refreshToken: string) => {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const request = callRefresh(refreshToken);
  inFlight.set(refreshToken, request);
  setTimeout(() => inFlight.delete(refreshToken), REFRESH_RESULT_TTL_MS);
  return request;
};

export const revokeBackendRefreshToken = async (refreshToken: string) => {
  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers: refreshCookieHeader(refreshToken),
  });
};
