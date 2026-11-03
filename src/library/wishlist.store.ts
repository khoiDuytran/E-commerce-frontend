"use client";

import {
  addWishlistProductAction,
  getWishlistIdsAction,
  removeWishlistProductAction,
} from "@/utils/actions";
import { useSyncExternalStore } from "react";

// Trạng thái yêu thích dùng chung cho mọi nút tim trên trang, để thẻ sản phẩm và
// trang chi tiết luôn khớp nhau. Dữ liệu thật nằm ở backend.
type WishlistStatus = "idle" | "loading" | "ready" | "signed-out" | "error";

interface IWishlistState {
  status: WishlistStatus;
  ids: ReadonlySet<string>;
}

export type ToggleResult = "added" | "removed" | "signed-out" | "error";

const INITIAL_STATE: IWishlistState = { status: "idle", ids: new Set() };

const listeners = new Set<() => void>();
let state = INITIAL_STATE;
let loading: Promise<void> | null = null;

const setState = (next: IWishlistState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const load = () => {
  loading ??= getWishlistIdsAction()
    .catch(() => ({ ids: null, reason: "error" as const }))
    .then((result) => {
      setState(
        result.ids
          ? { status: "ready", ids: new Set(result.ids) }
          : { status: result.reason, ids: new Set() },
      );
    })
    .finally(() => {
      loading = null;
    });
  return loading;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Tải lần đầu, và tải lại khi lần trước chưa đăng nhập hoặc lỗi: khách có thể vừa
  // đăng nhập rồi chuyển trang (client navigation không tải lại module này)
  if (state.status !== "ready" && state.status !== "loading") {
    setState({ ...state, status: "loading" });
    void load();
  }
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL_STATE;

export const useWishlist = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/** Thêm hoặc bỏ yêu thích, cập nhật ngay trên giao diện và hoàn tác nếu backend lỗi */
export const toggleWishlist = async (productId: string): Promise<ToggleResult> => {
  if (loading) await loading;
  if (state.status === "signed-out") return "signed-out";

  const wasLiked = state.ids.has(productId);
  const optimistic = new Set(state.ids);
  if (wasLiked) optimistic.delete(productId);
  else optimistic.add(productId);
  setState({ status: "ready", ids: optimistic });

  const result = wasLiked
    ? await removeWishlistProductAction(productId)
    : await addWishlistProductAction(productId);
  if (result === "ok") return wasLiked ? "removed" : "added";

  // Hoàn tác chỉ mục này, giữ các thay đổi khác diễn ra trong lúc chờ
  const reverted = new Set(state.ids);
  if (wasLiked) reverted.add(productId);
  else reverted.delete(productId);
  setState({
    status: result === "signed-out" ? "signed-out" : state.status,
    ids: reverted,
  });
  return result;
};
