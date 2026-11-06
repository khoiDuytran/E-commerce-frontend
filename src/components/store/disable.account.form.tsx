"use client";

import { disablePushBeforeSignOut } from "@/library/web.push";
import {
  handleDisableMyAccountAction,
  handleRequestDisableCodeAction,
} from "@/utils/actions";
import { toErrorText } from "@/utils/store";
import { signOut } from "next-auth/react";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthSubmit } from "./auth.ui";

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

const DisableAccountForm = () => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await handleRequestDisableCodeAction(email);
      if (res?.data) {
        setUserEmail(res.data.email);
        setStep("code");
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDisable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code")).trim();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await handleDisableMyAccountAction(code);
      if (!res?.data) {
        setError(toErrorText(res?.message));
        setIsSubmitting(false);
        return;
      }
      // Giữ trạng thái đang xử lý cho đến khi chuyển trang
      await disablePushBeforeSignOut();
      await signOut({ callbackUrl: "/auth/login?disabled=1" });
    } catch {
      setError(CONNECTION_ERROR);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm">
      <p className="pb-4">
        Sau khi vô hiệu hóa, bạn sẽ bị đăng xuất khỏi mọi thiết bị và không đăng
        nhập được nữa. Bạn có thể khôi phục lại tài khoản bằng email đăng ký ở
        trang đăng nhập.
      </p>

      {step === "email" && (
        <form key="email" onSubmit={onSendCode}>
          <AuthField
            label="Email đăng ký"
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
        <form key="code" onSubmit={onDisable}>
          <p className="pb-4" role="status">
            Đã gửi mã xác nhận tới {userEmail}.
          </p>
          <AuthField
            label="Mã xác nhận"
            name="code"
            autoComplete="one-time-code"
            required
          />
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>
            Vô hiệu hóa tài khoản
          </AuthSubmit>
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep("email");
            }}
            disabled={isSubmitting}
            className="mt-4 cursor-pointer underline disabled:opacity-50"
          >
            Gửi lại mã
          </button>
        </form>
      )}
    </div>
  );
};

export default DisableAccountForm;
