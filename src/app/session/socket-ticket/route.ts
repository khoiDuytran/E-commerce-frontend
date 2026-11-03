import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import { NextResponse } from "next/server";

// Cấp vé mở WebSocket thông báo (sống 60 giây, không gọi được REST API).
// Đặt ngoài /api để request đi qua proxy: proxy làm mới access token trước khi
// cấp vé, kể cả khi khách đang ở trang chủ (trang chủ không qua proxy).
// Chỉ nhận POST: cookie SameSite=lax không gửi kèm POST từ trang khác.
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST() {
  const session = await auth();
  const token = session?.access_token || session?.user?.access_token;
  if (!token) {
    return NextResponse.json({ ticket: null }, { status: 401, headers: noStore });
  }

  const res = await sendRequest<IBackendRes<{ ticket: string }>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/socket-ticket`,
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  const ticket = res?.data?.ticket;
  if (!ticket) {
    // 401: phiên đã hết, client dừng hẳn; lỗi khác: client thử lại sau
    const status = res?.statusCode === 401 ? 401 : 502;
    return NextResponse.json({ ticket: null }, { status, headers: noStore });
  }
  return NextResponse.json({ ticket }, { headers: noStore });
}
