"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

const VerifyForm = ({ id }: { id: string }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code")).trim();

    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ isBeforeCheck: boolean }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check-code`,
        method: "POST",
        body: { _id: id, code },
      });
      if (res?.data) {
        router.push("/auth/login?activated=1");
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPanel title="Kích hoạt tài khoản">
      <p className="pb-4">
        Mã xác nhận đã được gửi tới email đăng ký, vui lòng kiểm tra email.
      </p>
      <form onSubmit={onSubmit}>
        <AuthField
          label="Mã xác nhận"
          name="code"
          autoComplete="one-time-code"
          required
        />
        <AuthError message={error} />
        <AuthSubmit isSubmitting={isSubmitting}>Kích hoạt</AuthSubmit>
      </form>
      <p className="pt-6">
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="underline">
          Đăng nhập
        </Link>
      </p>
    </AuthPanel>
  );
};

export default VerifyForm;
