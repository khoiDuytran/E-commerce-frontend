"use client";

import { clearCart, setCartNote, useCart } from "@/library/cart.store";
import {
  handleCreateOrderAction,
  handleLookupCouponAction,
} from "@/utils/actions";
import { formatVnd, getCouponDiscount, toErrorText } from "@/utils/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AddressBook from "./address.book";
import StoreImage from "./store.image";

interface IProps {
  addresses: IStoreAddress[];
}

type PaymentMethod = "COD" | "VNPAY";

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "VNPAY", label: "Thanh toán online qua VNPay" },
];

const CheckoutForm = ({ addresses }: IProps) => {
  const router = useRouter();
  const { items, note, subtotal } = useCart();
  const [chosenAddressId, setChosenAddressId] = useState<string>();
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<IStoreCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);

  // Địa chỉ đã chọn có thể vừa bị xóa nên phải suy ra lại từ danh sách mới nhất
  const selectedAddress =
    addresses.find((item) => item._id === chosenAddressId) ??
    addresses.find((item) => item.isDefault) ??
    addresses[0];

  const discount = getCouponDiscount(coupon, subtotal);
  const total = Math.max(subtotal - discount, 0);

  const onApplyCoupon = async () => {
    setCouponError("");
    setCoupon(null);
    const res = await handleLookupCouponAction(couponCode);
    if (!res.coupon) {
      setCouponError(res.error ?? "Mã giảm giá không hợp lệ");
      return;
    }
    if (subtotal < (res.coupon.minOrderValue ?? 0)) {
      setCouponError(
        `Đơn hàng tối thiểu ${formatVnd(res.coupon.minOrderValue ?? 0)} để dùng mã này`,
      );
      return;
    }
    setCoupon(res.coupon);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Tránh giao tới địa chỉ cũ khi khách đang nhập địa chỉ mới mà chưa lưu
    if (isAddressFormOpen) {
      setOrderError("Vui lòng lưu địa chỉ đang nhập trước khi đặt hàng.");
      return;
    }
    if (!selectedAddress) {
      setOrderError("Vui lòng thêm địa chỉ giao hàng.");
      return;
    }
    setOrderError("");
    setIsSubmitting(true);
    try {
      const res = await handleCreateOrderAction({
        items: items.map((item) => ({
          product: item.productId,
          ...(item.variantId && { variant: item.variantId }),
          quantity: item.quantity,
        })),
        addressId: selectedAddress._id,
        paymentMethod,
        ...(coupon && { coupon: coupon._id }),
        ...(note.trim() && { note: note.trim() }),
      });

      const order = res?.data?.order;
      if (!order) {
        setOrderError(toErrorText(res?.message));
        return;
      }

      setIsPlaced(true);
      clearCart();
      const checkoutUrl = res.data?.payment?.paymentInfo?.checkoutUrl;
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
      } else {
        router.push(
          `/checkout/result?code=${encodeURIComponent(order.orderCode)}`,
        );
      }
    } catch {
      setOrderError("Không thể tạo đơn hàng lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPlaced) {
    return (
      <p role="status" className="px-4 py-16 text-center">
        Đang chuyển trang...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-16 text-center">
        Giỏ hàng đang trống.{" "}
        <Link href="/shop" className="underline">
          Tiếp tục mua sắm
        </Link>
      </p>
    );
  }

  const inputClass =
    "mt-2 block w-full border border-neutral-300 p-3 outline-none focus:border-black";

  return (
    // Sổ địa chỉ có form riêng nên thẻ form đặt hàng chỉ bọc nút đặt hàng, tránh form lồng nhau
    <div className="grid gap-10 px-4 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,38%)] md:gap-20 md:px-10">
      <div className="space-y-10">
        <section>
          <h2 className="border-b border-neutral-200 pb-4">
            Thông tin giao hàng
          </h2>
          <div className="mt-6">
            <AddressBook
              addresses={addresses}
              selectedId={selectedAddress?._id}
              onSelect={setChosenAddressId}
              onFormOpenChange={(isOpen) => {
                setIsAddressFormOpen(isOpen);
                // Lỗi nhắc lưu địa chỉ không còn đúng khi form đã đóng
                if (!isOpen) setOrderError("");
              }}
            />
          </div>
          <label className="mt-6 block">
            Ghi chú đơn hàng
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setCartNote(event.target.value)}
              className={inputClass}
            />
          </label>
        </section>

        <fieldset>
          <legend className="w-full border-b border-neutral-200 pb-4">
            Phương thức thanh toán
          </legend>
          <div className="mt-6 space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={`flex cursor-pointer items-center gap-3 border p-4 ${
                  paymentMethod === method.value
                    ? "border-black"
                    : "border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                  className="accent-black"
                />
                {method.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="md:sticky md:top-24 md:self-start">
        <h2 className="border-b border-neutral-200 pb-4">Đơn hàng</h2>
        <ul>
          {items.map((item) => (
            <li
              key={item.variantId ?? item.productId}
              className="flex gap-4 border-b border-neutral-200 py-4"
            >
              <div className="relative aspect-square w-14 shrink-0">
                <StoreImage src={item.image} alt={item.name} sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="uppercase">{item.name}</p>
                <p className="mt-1 text-xs text-neutral-600">
                  {item.variantName && `${item.variantName} · `}SL:{" "}
                  {item.quantity}
                </p>
              </div>
              <span>{formatVnd(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <label htmlFor="coupon-code">Mã giảm giá</label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon-code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              className="min-w-0 flex-1 border border-neutral-300 p-3 uppercase outline-none focus:border-black"
            />
            <button
              type="button"
              disabled={!couponCode.trim()}
              onClick={onApplyCoupon}
              className="cursor-pointer rounded-full border border-black px-6 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-500"
            >
              Áp dụng
            </button>
          </div>
          <p aria-live="polite" className="mt-2 text-xs">
            {couponError && <span className="text-red-700">{couponError}</span>}
            {coupon && `Đã áp dụng mã ${coupon.code}`}
          </p>
        </div>

        <dl className="mt-6 space-y-3">
          <div className="flex justify-between">
            <dt>Tạm tính</dt>
            <dd>{formatVnd(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <dt>Giảm giá</dt>
              <dd>-{formatVnd(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-3 font-medium">
            <dt>Tổng thanh toán</dt>
            <dd>{formatVnd(total)}</dd>
          </div>
        </dl>

        <form onSubmit={onSubmit}>
          {orderError && (
            <p role="alert" className="mt-4 text-red-700">
              {orderError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full cursor-pointer rounded-full bg-black py-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
          </button>
        </form>
      </aside>
    </div>
  );
};

export default CheckoutForm;
