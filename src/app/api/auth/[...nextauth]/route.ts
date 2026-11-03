import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Referring to the auth.ts we just created
export const { POST } = handlers;

// Session callback cũng phục vụ auth() phía server nên vẫn có access token;
// token chỉ bị bỏ ở endpoint mà trình duyệt đọc được.
export const GET = async (req: NextRequest) => {
  const response = await handlers.GET(req);
  if (!req.nextUrl.pathname.endsWith("/session") || !response.ok) {
    return response;
  }

  const session = await response.json();
  if (session?.access_token) delete session.access_token;
  if (session?.user?.access_token) delete session.user.access_token;

  return NextResponse.json(session, {
    status: response.status,
    headers: response.headers,
  });
};
