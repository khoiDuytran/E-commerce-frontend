"use client";

import {
  removeCartItem,
  setCartItemQuantity,
  setCartNote,
  useCart,
} from "@/library/cart.store";
import { formatVnd } from "@/utils/store";
import Link from "next/link";
import StoreImage from "./store.image";

const CartView = () => {
  const { items, note, count, subtotal } = useCart();

  return (
    <div className="px-4 pb-16 md:px-10">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <h1>Giỏ hàng</h1>
        <span className="text-xs text-neutral-600">({count} sản phẩm)</span>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center">
          Giỏ hàng đang trống.{" "}
          <Link href="/shop" className="underline">
            Tiếp tục mua sắm
          </Link>
        </p>
      ) : (
        <div className="grid gap-10 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,38%)] md:gap-20">
          <ul>
            {items.map((item) => (
              <li
                key={item.variantId ?? item.productId}
                className="flex gap-6 border-b border-neutral-200 py-6"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative aspect-square w-20 shrink-0"
                >
                  <StoreImage src={item.image} alt={item.name} sizes="80px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="uppercase hover:underline"
                  >
                    {item.name}
                  </Link>
                  {item.variantName && (
                    <p className="mt-1 text-xs text-neutral-600">
                      {item.variantName}
                    </p>
                  )}
                  <p className="mt-2">{formatVnd(item.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${item.name}`}
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        setCartItemQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity - 1,
                        )
                      }
                      className="size-8 cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-400"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${item.name}`}
                      disabled={item.quantity >= item.maxQuantity}
                      onClick={() =>
                        setCartItemQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity + 1,
                        )
                      }
                      className="size-8 cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-400"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeCartItem(item.productId, item.variantId)
                    }
                    className="cursor-pointer text-xs text-neutral-600 underline hover:text-black"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="md:sticky md:top-24 md:self-start">
            <div className="flex justify-between">
              <span>Tổng cộng</span>
              <span>{formatVnd(subtotal)}</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600">
              Giảm giá và phí vận chuyển được tính ở bước thanh toán.
            </p>
            <label className="mt-6 block">
              Ghi chú đơn hàng
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setCartNote(event.target.value)}
                placeholder="Yêu cầu đặc biệt..."
                className="mt-2 block w-full border border-neutral-300 p-3 outline-none focus:border-black"
              />
            </label>
            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-black py-4 text-center font-medium text-white"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
