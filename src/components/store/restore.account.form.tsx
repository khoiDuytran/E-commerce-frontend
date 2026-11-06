"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const RestoreAccountForm = () => {
  const router = useRouter();
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
      const res = await sendRequest<IBackendRes<{ email: string }>>({
        url: `${BACKEND_URL}/api/auth/restore/code`,
        method: "POST",
        body: { email },
      });
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

  const onRestore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code")).trim();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<unknown>>({
        url: `${BACKEND_URL}/api/auth/restore`,
        method: "POST",
        body: { email: userEmail, code },
      });
      if (res?.data) {
        router.push("/auth/login?restored=1");
        return;
      }
      setError(toErrorText(res?.message));
    } catch {
      setError(CONNECTION_ERROR);
    }
    setIsSubmitting(false);
  };

  return (
    <AuthPanel title="Khôi phục tài khoản">
      {step === "email" && (
        <form key="email" onSubmit={onSendCode}>
          <p className="pb-4">
            Nhập email đăng ký của tài khoản đã vô hiệu hóa để nhận mã xác nhận.
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
        <form key="code" onSubmit={onRestore}>
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
            Khôi phục tài khoản
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

      <Link href="/auth/login" className="mt-6 inline-block underline">
        Quay lại đăng nhập
      </Link>
    </AuthPanel>
  );
};

export default RestoreAccountForm;
