"use client";

import { useSyncExternalStore } from "react";

interface ICartState {
  items: ICartItem[];
  note: string;
}

// Giỏ hàng lưu ở trình duyệt để khách chưa đăng nhập vẫn dùng được;
// giá ở đây chỉ để hiển thị, backend tính lại khi tạo đơn.
const STORAGE_KEY = "store.cart.v1";
const EMPTY_CART: ICartState = { items: [], note: "" };

const listeners = new Set<() => void>();
let cache: ICartState | null = null;

const read = (): ICartState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return Array.isArray(parsed?.items)
      ? { items: parsed.items, note: String(parsed.note ?? "") }
      : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
};

const getSnapshot = () => {
  cache ??= read();
  return cache;
};

const write = (next: ICartState) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Trình duyệt chặn lưu trữ: giỏ hàng vẫn dùng được trong phiên hiện tại
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = read();
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const isSameItem = (item: ICartItem, productId: string, variantId?: string) =>
  item.productId === productId && item.variantId === variantId;

export const addCartItem = (item: ICartItem) => {
  const cart = getSnapshot();
  const existing = cart.items.find((current) =>
    isSameItem(current, item.productId, item.variantId),
  );
  const items = existing
    ? cart.items.map((current) =>
        current === existing
          ? {
              ...item,
              quantity: Math.min(
                current.quantity + item.quantity,
                item.maxQuantity,
              ),
            }
          : current,
      )
    : [...cart.items, item];
  write({ ...cart, items });
};

export const setCartItemQuantity = (
  productId: string,
  variantId: string | undefined,
  quantity: number,
) => {
  const cart = getSnapshot();
  write({
    ...cart,
    items: cart.items.map((item) =>
      isSameItem(item, productId, variantId)
        ? {
            ...item,
            quantity: Math.min(Math.max(quantity, 1), item.maxQuantity),
          }
        : item,
    ),
  });
};

export const removeCartItem = (productId: string, variantId?: string) => {
  const cart = getSnapshot();
  write({
    ...cart,
    items: cart.items.filter((item) => !isSameItem(item, productId, variantId)),
  });
};

export const setCartNote = (note: string) => write({ ...getSnapshot(), note });

export const clearCart = () => write(EMPTY_CART);

export const useCart = () => {
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART);
  return {
    ...cart,
    count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ),
  };
};
