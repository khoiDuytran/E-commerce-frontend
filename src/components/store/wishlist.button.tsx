"use client";

import { toggleWishlist, useWishlist } from "@/library/wishlist.store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartIcon } from "./store.icons";

interface IProps {
  productId: string;
  productName: string;
  // icon: nút tròn đè lên ảnh thẻ sản phẩm; full: nút có chữ ở trang chi tiết
  variant?: "icon" | "full";
  onRemoved?: () => void;
}

const WishlistButton = ({
  productId,
  productName,
  variant = "icon",
  onRemoved,
}: IProps) => {
  const router = useRouter();
  const { status, ids } = useWishlist();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  const isLiked = ids.has(productId);
  const label = isLiked
    ? `Bỏ ${productName} khỏi danh sách yêu thích`
    : `Thêm ${productName} vào danh sách yêu thích`;

  // Đăng nhập xong quay lại đúng trang đang xem
  const goToLogin = () => {
    const { pathname, search } = window.location;
    router.push(
      `/auth/login?callbackUrl=${encodeURIComponent(pathname + search)}`,
    );
  };

  const onClick = async () => {
    setError("");
    if (status === "signed-out") {
      goToLogin();
      return;
    }
    setIsBusy(true);
    const result = await toggleWishlist(productId);
    setIsBusy(false);
    if (result === "signed-out") {
      goToLogin();
    } else if (result === "error") {
      setError("Không cập nhật được danh sách yêu thích. Vui lòng thử lại.");
    } else if (result === "removed") {
      onRemoved?.();
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={isBusy}
        aria-pressed={isLiked}
        aria-label={label}
        title={error || label}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-black backdrop-blur-sm transition-opacity hover:opacity-70 disabled:cursor-wait"
      >
        <HeartIcon filled={isLiked} />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={isBusy}
        aria-pressed={isLiked}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-black py-4 font-medium transition-colors hover:bg-neutral-50 disabled:cursor-wait"
      >
        <HeartIcon filled={isLiked} />
        {isLiked ? "Đã yêu thích" : "Thêm vào yêu thích"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
};

export default WishlistButton;
