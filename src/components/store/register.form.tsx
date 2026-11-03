"use client";

import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthPanel, AuthSubmit } from "./auth.ui";

const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();

    setError("");
    setIsSubmitting(true);
    try {
      const res = await sendRequest<IBackendRes<{ _id: string }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
        method: "POST",
        body: {
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
          ...(name && { name }),
        },
      });
      if (res?.data) {
        router.push(`/verify/${res.data._id}`);
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
    <AuthPanel title="Đăng ký tài khoản">
      <form onSubmit={onSubmit}>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <AuthField label="Họ tên" name="name" autoComplete="name" />
        <AuthError message={error} />
        <AuthSubmit isSubmitting={isSubmitting}>Đăng ký</AuthSubmit>
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

export default RegisterForm;
