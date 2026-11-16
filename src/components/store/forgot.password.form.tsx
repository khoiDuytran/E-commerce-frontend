"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

type Step = "email" | "code" | "password" | "done";

const ForgotPasswordForm = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<Step>("email");
  const [userEmail, setUserEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToStep = (next: Step) => {
    setError("");
    setNotice("");
    setStep(next);
  };

  // Gọi API và chỉ chuyển bước khi backend trả về data
  const submit = async <T,>(
    path: string,
    body: Record<string, string>,
    onSuccess: (data: T) => void,
  ) => {
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<T>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${path}`,
        method: "POST",
        body,
      });
      if (res?.data) {
        onSuccess(res.data);
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 1: backend chỉ gửi mã khi email đã đăng ký tài khoản
  const onSendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    void submit<{ email: string }>("retry-password", { email }, (data) => {
      setUserEmail(data.email);
      goToStep("code");
    });
  };

  const onResendCode = () => {
    void submit<{ email: string }>(
      "retry-password",
      { email: userEmail },
      () => setNotice("Đã gửi lại mã xác nhận mới. Mã cũ không còn dùng được."),
    );
  };

  // Bước 2: kiểm tra mã trước khi cho nhập mật khẩu mới
  const onCheckCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("code")).trim();
    void submit<{ isValid: boolean }>(
      "check-reset-code",
      { email: userEmail, code: value },
      () => {
        setCode(value);
        goToStep("password");
      },
    );
  };

  // Bước 3: backend kiểm tra lại mã khi đổi mật khẩu
  const onResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    void submit<{ isBeforeCheck: boolean }>(
      "change-password",
      { code, password, confirmPassword, email: userEmail },
      () => goToStep("done"),
    );
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
      {step === "code" && (
        <form key="code" onSubmit={onCheckCode}>
          <p className="pb-4">
            Mã xác nhận đã được gửi tới <strong>{userEmail}</strong>. Mã có
            hiệu lực trong 5 phút.
          </p>
          <AuthField
            label="Mã xác nhận"
            name="code"
            autoComplete="one-time-code"
            required
          />
          {notice && (
            <p role="status" className="pb-2 text-sm">
              {notice}
            </p>
          )}
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Xác nhận mã</AuthSubmit>
          <div className="mt-4 flex justify-between gap-4 text-sm">
            <button
              type="button"
              onClick={() => goToStep("email")}
              className="cursor-pointer underline"
            >
              Đổi email
            </button>
            <button
              type="button"
              onClick={onResendCode}
              disabled={isSubmitting}
              className="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Gửi lại mã
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form key="password" onSubmit={onResetPassword}>
          <p className="pb-4">Nhập mật khẩu mới cho {userEmail}.</p>
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
