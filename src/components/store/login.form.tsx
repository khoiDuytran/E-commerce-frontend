"use client";

import { authenticate } from "@/utils/actions";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import ActivateForm from "./activate.form";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";
import ForgotPasswordForm from "./forgot.password.form";

// Chỉ chuyển hướng trong cùng site để callbackUrl không bị lợi dụng dẫn sang trang lạ
const getRedirectTarget = (callbackUrl: string | null, isAdmin: boolean) => {
  const fallback = isAdmin ? "/dashboard" : "/";
  if (!callbackUrl) return fallback;
  try {
    const url = new URL(callbackUrl, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (url.pathname.startsWith("/dashboard") && !isAdmin) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
};

const LoginForm = () => {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"login" | "activate" | "forgot">("login");
  const [inactiveEmail, setInactiveEmail] = useState("");
  const [error, setError] = useState("");
  const [isDisabledAccount, setIsDisabledAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backToLogin = () => setView("login");

  if (view === "activate") {
    return <ActivateForm email={inactiveEmail} onBack={backToLogin} />;
  }
  if (view === "forgot") return <ForgotPasswordForm onBack={backToLogin} />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username")).trim();
    const password = String(form.get("password"));

    setError("");
    setIsDisabledAccount(false);
    setIsSubmitting(true);
    try {
      const res = await authenticate(username, password);

      if (res?.error) {
        setIsSubmitting(false);
        if (res.code === 2) {
          setInactiveEmail(username);
          setView("activate");
        } else if (res.code === 3) {
          setIsDisabledAccount(true);
        } else if (res.code === 1) {
          setError("Email hoặc mật khẩu không đúng.");
        } else if (res.code === 4) {
          setError(
            "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.",
          );
        } else {
          setError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
        }
        return;
      }

      // Tải lại toàn trang để header nhận phiên đăng nhập mới. getSession() chạy sau
      // khi signIn đã ghi cookie nên không chạy song song với lần làm mới token nào
      const session = await getSession();
      window.location.assign(
        getRedirectTarget(
          searchParams.get("callbackUrl"),
          session?.user?.role === "ADMIN",
        ),
      );
    } catch {
      setIsSubmitting(false);
      setError("Không thể đăng nhập lúc này. Vui lòng thử lại.");
    }
  };

  return (
    <AuthPanel title="Đăng nhập">
      {searchParams.get("activated") === "1" && (
        <p role="status" className="pb-4">
          Kích hoạt tài khoản thành công. Vui lòng đăng nhập.
        </p>
      )}
      {searchParams.get("disabled") === "1" && (
        <p role="status" className="pb-4">
          Tài khoản đã được vô hiệu hóa.
        </p>
      )}
      {searchParams.get("restored") === "1" && (
        <p role="status" className="pb-4">
          Khôi phục tài khoản thành công. Vui lòng đăng nhập.
        </p>
      )}
      <form onSubmit={onSubmit}>
        <AuthField
          label="Email"
          name="username"
          type="email"
          autoComplete="username"
          required
        />
        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <AuthError message={error} />
        {isDisabledAccount && (
          <p role="alert" className="pb-4">
            Tài khoản đã bị vô hiệu hóa.{" "}
            <Link href="/auth/restore" className="underline">
              Khôi phục tài khoản
            </Link>
          </p>
        )}
        <AuthSubmit isSubmitting={isSubmitting}>Đăng nhập</AuthSubmit>
      </form>
      <div className="flex items-center justify-between gap-4 pt-6">
        <button
          type="button"
          onClick={() => setView("forgot")}
          className="cursor-pointer underline"
        >
          Quên mật khẩu?
        </button>
        <Link href="/auth/register" className="underline">
          Đăng ký
        </Link>
      </div>
    </AuthPanel>
  );
};

export default LoginForm;
