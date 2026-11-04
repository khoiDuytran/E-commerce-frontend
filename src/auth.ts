import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { IUser } from "./types/next-auth";
import {
  InactiveAccountError,
  InvalidEmailPasswordError,
} from "./utils/errors";
import {
  readRefreshCookie,
  revokeBackendRefreshToken,
  SESSION_MAX_AGE,
} from "./utils/backend.tokens";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Gọi fetch trực tiếp để đọc được refresh cookie trong response
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: credentials?.username,
              password: credentials?.password,
            }),
          },
        );

        if (response.ok) {
          const res: IBackendRes<ILogin> = await response.json();
          const accessToken = res.data?.access_token;
          const refreshToken = readRefreshCookie(response);
          // Thiếu refresh token thì phiên chết sau khi access token hết hạn mà không
          // rõ lý do, nên báo lỗi ngay lúc đăng nhập
          if (!accessToken || !refreshToken) {
            throw new Error("Backend không trả đủ token khi đăng nhập");
          }
          return {
            _id: res.data?.user?._id,
            id: res.data?.user?._id,
            name: res.data?.user?.name,
            email: res.data?.user?.email,
            role: res.data?.user?.role,
            access_token: accessToken,
            refresh_token: refreshToken,
          };
        } else if (response.status === 401) {
          throw new InvalidEmailPasswordError();
        } else if (response.status === 400) {
          throw new InactiveAccountError();
        } else {
          throw new Error("Internal server error");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    maxAge: SESSION_MAX_AGE,
  },
  events: {
    async signOut(message) {
      const refreshToken =
        "token" in message ? message.token?.refresh_token : undefined;
      if (!refreshToken) return;
      // Thu hồi ở backend chỉ là best-effort: lỗi ở đây không được chặn việc xoá phiên
      try {
        await revokeBackendRefreshToken(refreshToken);
      } catch (error) {
        console.error("Không thu hồi được refresh token khi đăng xuất", error);
      }
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Chỉ có user khi vừa đăng nhập. Token lưu riêng, không nằm trong user.
        const { access_token, refresh_token, ...profile } = user as IUser & {
          access_token: string;
          refresh_token: string;
        };
        token.user = profile;
        token.access_token = access_token;
        token.refresh_token = refresh_token;
      }
      return token;
    },
    session({ session, token }) {
      // Chọn từng field: phiên tạo trước đây còn access_token trong token.user
      const { _id, id, name, email, role } = token.user;
      (session.user as IUser) = { _id, id, name, email, role };
      session.access_token = token.access_token;
      return session;
    },
  },
});
