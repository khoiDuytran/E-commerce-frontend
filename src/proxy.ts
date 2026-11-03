import { encode, getToken, JWT } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  isAccessTokenExpiring,
  refreshBackendTokens,
  SESSION_MAX_AGE,
} from "./utils/backend.tokens";

const SECURE_COOKIE = "__Secure-authjs.session-token";
const PLAIN_COOKIE = "authjs.session-token";

const redirectToLogin = (req: NextRequest) => {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = "";
  url.searchParams.set("callbackUrl", req.nextUrl.href);
  return NextResponse.redirect(url);
};

// Làm mới token ở đây vì server component không ghi được cookie: phiên mới được
// ghi cho trình duyệt, đồng thời ghi đè cookie của request để auth() đọc được ngay.
export async function proxy(req: NextRequest) {
  const cookieName = req.cookies.has(SECURE_COOKIE)
    ? SECURE_COOKIE
    : PLAIN_COOKIE;
  const secret = process.env.AUTH_SECRET!;
  let token: JWT | null = await getToken({
    req,
    secret,
    cookieName,
    salt: cookieName,
    secureCookie: cookieName === SECURE_COOKIE,
  });

  let sessionCookie: string | undefined;
  let sessionExpired = false;

  if (token && isAccessTokenExpiring(token.access_token)) {
    const result = token.refresh_token
      ? await refreshBackendTokens(token.refresh_token)
      : ({ status: "invalid" } as const);

    if (result.status === "ok") {
      token = {
        ...token,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: { ...token.user, access_token: result.accessToken },
      };
      sessionCookie = await encode({
        token,
        secret,
        salt: cookieName,
        maxAge: SESSION_MAX_AGE,
      });
    } else if (result.status === "invalid") {
      token = null;
      sessionExpired = true;
    }
  }

  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const allowed = !isDashboard || token?.user?.role === "ADMIN";

  let response: NextResponse;
  if (!allowed) {
    response = redirectToLogin(req);
  } else if (sessionCookie) {
    req.cookies.set(cookieName, sessionCookie);
    const headers = new Headers(req.headers);
    headers.set("cookie", req.cookies.toString());
    response = NextResponse.next({ request: { headers } });
  } else {
    response = NextResponse.next();
  }

  if (sessionCookie) {
    response.cookies.set(cookieName, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: cookieName === SECURE_COOKIE,
      maxAge: SESSION_MAX_AGE,
    });
  } else if (sessionExpired) {
    response.cookies.delete(cookieName);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|verify|$).*)",
  ],
};
