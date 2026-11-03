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
          return {
            _id: res.data?.user?._id,
            id: res.data?.user?._id,
            name: res.data?.user?.name,
            email: res.data?.user?.email,
            role: res.data?.user?.role,
            access_token: res.data?.access_token,
            refresh_token: readRefreshCookie(response),
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
      if (refreshToken) await revokeBackendRefreshToken(refreshToken);
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // User is available during sign-in
        const { refresh_token, ...profile } = user as IUser & {
          refresh_token: string;
        };
        token.user = profile;
        token.access_token = profile.access_token;
        token.refresh_token = refresh_token;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as IUser) = token.user;
      session.access_token =
        (token.access_token as string) ?? (token.user as IUser)?.access_token;
      return session;
    },
  },
});
