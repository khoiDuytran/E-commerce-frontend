import { STORE_HERO_IMAGE } from "@/utils/store";
import { InputHTMLAttributes, ReactNode } from "react";
import StoreImage from "./store.image";

interface IFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const AuthPanel = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="relative flex min-h-[calc(100dvh-10rem)] items-center justify-center bg-neutral-100 px-4 py-16">
    {/* Ảnh chỉ để trang trí nên alt rỗng; ảnh lỗi thì vẫn còn nền xám */}
    <StoreImage src={STORE_HERO_IMAGE} alt="" sizes="100vw" cover />
    <div className="relative w-full max-w-sm bg-white p-6">
      <h1 className="border-b border-neutral-200 pb-4">{title}</h1>
      <div className="pt-6">{children}</div>
    </div>
  </div>
);

export const AuthField = ({ label, ...inputProps }: IFieldProps) => (
  <label className="block pb-4">
    {label}
    <input
      {...inputProps}
      className="mt-2 block w-full border border-neutral-300 p-3 outline-none focus:border-black disabled:text-neutral-600"
    />
  </label>
);

export const AuthError = ({ message }: { message: string }) =>
  message ? (
    <p role="alert" className="pb-4">
      {message}
    </p>
  ) : null;

export const AuthSubmit = ({
  isSubmitting,
  children,
}: {
  isSubmitting: boolean;
  children: ReactNode;
}) => (
  <button
    type="submit"
    disabled={isSubmitting}
    className="w-full cursor-pointer bg-black p-3 text-white transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {isSubmitting ? "Đang xử lý..." : children}
  </button>
);
