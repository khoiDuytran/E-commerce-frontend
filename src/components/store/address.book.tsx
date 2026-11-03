"use client";

import {
  handleCreateAddressAction,
  handleDeleteAddressAction,
  handleSetDefaultAddressAction,
  handleUpdateAddressAction,
} from "@/utils/actions";
import { toErrorText } from "@/utils/store";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { AuthError, AuthField, AuthSubmit } from "./auth.ui";

interface IProps {
  addresses: IStoreAddress[];
  // Truyền khi nhúng vào trang thanh toán để khách chọn địa chỉ giao hàng
  selectedId?: string;
  onSelect?: (id: string) => void;
  onFormOpenChange?: (isOpen: boolean) => void;
}

const FIELDS: Array<{
  key: keyof IShippingAddress;
  label: string;
  autoComplete: string;
}> = [
  { key: "fullName", label: "Họ và tên", autoComplete: "name" },
  { key: "phone", label: "Số điện thoại", autoComplete: "tel" },
  { key: "detail", label: "Địa chỉ, tên đường", autoComplete: "street-address" },
  { key: "ward", label: "Phường/Xã", autoComplete: "off" },
  { key: "district", label: "Quận/Huyện", autoComplete: "off" },
  { key: "province", label: "Tỉnh/Thành phố", autoComplete: "off" },
];

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

const AddressBook = ({
  addresses,
  selectedId,
  onSelect,
  onFormOpenChange,
}: IProps) => {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  // "new" là đang thêm mới, còn lại là _id của địa chỉ đang sửa
  const [formTarget, setFormTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editing = addresses.find((item) => item._id === formTarget);
  const isFormOpen =
    formTarget !== null || (addresses.length === 0 && !isRefreshing);
  const isBusy = isSubmitting || isRefreshing;

  const openForm = (target: string | null) => {
    setError("");
    setFormTarget(target);
    onFormOpenChange?.(target !== null);
  };

  const refresh = () => startRefresh(() => router.refresh());

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      FIELDS.map(({ key }) => [key, String(form.get(key)).trim()]),
    ) as unknown as IShippingAddress;
    // Chỉ gửi khi được chọn: gửi false cho địa chỉ mặc định sẽ làm mất địa chỉ mặc định
    const isDefault = form.get("isDefault") === "on";
    const payload = { ...values, ...(isDefault && { isDefault }) };

    setError("");
    setIsSubmitting(true);
    try {
      const res = editing
        ? await handleUpdateAddressAction({ _id: editing._id, ...payload })
        : await handleCreateAddressAction(payload);
      if (!res?.data?.address) {
        setError(toErrorText(res?.message));
        return;
      }
      onSelect?.(res.data.address._id);
      openForm(null);
      refresh();
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (action: () => Promise<IBackendRes<unknown>>) => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await action();
      if (res?.data) {
        refresh();
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = (address: IStoreAddress) => {
    if (!window.confirm(`Xóa địa chỉ của ${address.fullName}?`)) return;
    runAction(() => handleDeleteAddressAction(address._id));
  };

  return (
    <div>
      {addresses.length > 0 && (
        <ul className="space-y-3">
          {addresses.map((address) => {
            const isSelected = onSelect && address._id === selectedId;
            return (
              <li
                key={address._id}
                className={`border p-4 ${
                  isSelected ? "border-black" : "border-neutral-300"
                }`}
              >
                <label
                  className={`flex items-start gap-3 ${
                    onSelect ? "cursor-pointer" : ""
                  }`}
                >
                  {onSelect && (
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={isSelected}
                      onChange={() => onSelect(address._id)}
                      className="mt-0.5 accent-black"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block">
                      {address.fullName} · {address.phone}
                      {address.isDefault && (
                        <span className="ml-2 text-xs text-neutral-600">
                          Mặc định
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-neutral-600">
                      {address.detail}, {address.ward}, {address.district},{" "}
                      {address.province}
                    </span>
                  </span>
                </label>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openForm(address._id)}
                    className="cursor-pointer underline disabled:cursor-not-allowed"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onDelete(address)}
                    className="cursor-pointer underline disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(() =>
                          handleSetDefaultAddressAction(address._id),
                        )
                      }
                      className="cursor-pointer underline disabled:cursor-not-allowed"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isFormOpen && <AuthError message={error} />}

      {isFormOpen ? (
        // key riêng để chuyển giữa thêm mới và sửa thì ô nhập lấy lại giá trị đúng
        <form
          key={formTarget ?? "empty"}
          onSubmit={onSave}
          className="mt-6 border border-neutral-300 p-4"
        >
          <h3 className="pb-4">{editing ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>
          <div className="grid gap-x-4 md:grid-cols-2">
            {FIELDS.map((field) => (
              <AuthField
                key={field.key}
                label={field.label}
                name={field.key}
                defaultValue={editing?.[field.key]}
                autoComplete={field.autoComplete}
                required
                {...(field.key === "phone" && {
                  type: "tel",
                  pattern: "(\\+84|0)[0-9]{9}",
                  title: "Số điện thoại gồm 10 chữ số, ví dụ 0912345678",
                })}
              />
            ))}
          </div>
          {!editing?.isDefault && (
            <label className="flex cursor-pointer items-center gap-2 pb-4">
              <input
                type="checkbox"
                name="isDefault"
                className="accent-black"
              />
              Đặt làm địa chỉ mặc định
            </label>
          )}
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isBusy}>Lưu địa chỉ</AuthSubmit>
          {formTarget !== null && (
            <button
              type="button"
              onClick={() => openForm(null)}
              className="mt-4 cursor-pointer underline"
            >
              Hủy
            </button>
          )}
        </form>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => openForm("new")}
          className="mt-4 cursor-pointer underline disabled:cursor-not-allowed"
        >
          Thêm địa chỉ mới
        </button>
      )}
    </div>
  );
};

export default AddressBook;
