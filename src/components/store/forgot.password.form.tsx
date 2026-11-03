"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

const ForgotPasswordForm = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ _id: string; email: string }>>(
        {
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/retry-password`,
          method: "POST",
          body: { email },
        },
      );
      if (res?.data) {
        setUserEmail(res.data.email);
        setStep("reset");
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code")).trim();
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ isBeforeCheck: boolean }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-password`,
        method: "POST",
        body: { code, password, confirmPassword, email: userEmail },
      });
      if (res?.data) {
        setStep("done");
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPanel title="Quên mật khẩu">
      {step === "email" && (
        <form key="email" onSubmit={onSendCode}>
          <p className="pb-4">
            Nhập email tài khoản để nhận mã đổi mật khẩu.
          </p>
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Gửi mã xác nhận</AuthSubmit>
        </form>
      )}

      {/* key riêng để ô nhập của bước trước không giữ lại giá trị đã gõ */}
      {step === "reset" && (
        <form key="reset" onSubmit={onResetPassword}>
          <AuthField
            label="Mã xác nhận"
            name="code"
            autoComplete="one-time-code"
            required
          />
          <AuthField
            label="Mật khẩu mới"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <AuthField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Đổi mật khẩu</AuthSubmit>
        </form>
      )}

      {step === "done" && (
        <p role="status">
          Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 cursor-pointer underline"
      >
        Quay lại đăng nhập
      </button>
    </AuthPanel>
  );
};

export default ForgotPasswordForm;
