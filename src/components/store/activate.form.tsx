"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

interface IProps {
  email: string;
  onBack: () => void;
}

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

const ActivateForm = ({ email, onBack }: IProps) => {
  const [step, setStep] = useState<"send" | "code" | "done">("send");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSendCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ _id: string }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/retry-active`,
        method: "POST",
        body: { email },
      });
      if (res?.data) {
        setUserId(res.data._id);
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

  const onCheckCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code")).trim();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ isBeforeCheck: boolean }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check-code`,
        method: "POST",
        body: { code, _id: userId },
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
    <AuthPanel title="Kích hoạt tài khoản">
      {step === "send" && (
        <form onSubmit={onSendCode}>
          <p className="pb-4">
            Tài khoản của bạn chưa được kích hoạt. Chúng tôi sẽ gửi mã xác nhận
            tới email này.
          </p>
          <AuthField label="Email" type="email" value={email} disabled readOnly />
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Gửi mã xác nhận</AuthSubmit>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={onCheckCode}>
          <p className="pb-4">Vui lòng nhập mã xác nhận đã gửi tới email.</p>
          <AuthField
            label="Mã xác nhận"
            name="code"
            autoComplete="one-time-code"
            required
          />
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Kích hoạt</AuthSubmit>
        </form>
      )}

      {step === "done" && (
        <p role="status">
          Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập lại.
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

export default ActivateForm;
