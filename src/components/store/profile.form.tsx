"use client";

import { handleUpdateProfileAction } from "@/utils/actions";
import { toErrorText } from "@/utils/store";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthSubmit } from "./auth.ui";

const ProfileForm = ({ profile }: { profile: IStoreProfile }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError("");
    setIsSaved(false);
    setIsSubmitting(true);
    try {
      const res = await handleUpdateProfileAction({
        name: String(form.get("name")).trim(),
        phone: String(form.get("phone")).trim(),
        address: String(form.get("address")).trim(),
      });
      if (res?.data?.user) {
        setIsSaved(true);
        router.refresh();
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
    <form onSubmit={onSubmit} className="max-w-md">
      <AuthField label="Email" type="email" value={profile.email} disabled readOnly />
      <AuthField
        label="Họ và tên"
        name="name"
        defaultValue={profile.name}
        autoComplete="name"
        maxLength={100}
      />
      <AuthField
        label="Số điện thoại"
        name="phone"
        type="tel"
        defaultValue={profile.phone}
        autoComplete="tel"
        pattern="(\+84|0)[0-9]{9}"
        title="Số điện thoại gồm 10 chữ số, ví dụ 0912345678"
      />
      {/* <AuthField
        label="Địa chỉ"
        name="address"
        defaultValue={profile.address}
        autoComplete="street-address"
        maxLength={255}
      /> */}
      <AuthError message={error} />
      {isSaved && (
        <p role="status" className="pb-4">
          Đã lưu thông tin.
        </p>
      )}
      <AuthSubmit isSubmitting={isSubmitting}>Lưu thay đổi</AuthSubmit>
    </form>
  );
};

export default ProfileForm;
