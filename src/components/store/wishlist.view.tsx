"use client";

import { useWishlist } from "@/library/wishlist.store";
import Link from "next/link";
import { ProductCard } from "./product.grid";
import WishlistButton from "./wishlist.button";

interface IProps {
  items: IStoreWishlistItem[];
}

const WishlistView = ({ items }: IProps) => {
  const { status, ids } = useWishlist();

  // Sau khi store tải xong, ẩn ngay sản phẩm vừa bỏ yêu thích (ở trang này hay nơi khác)
  const visible =
    status === "ready" ? items.filter((item) => ids.has(item._id)) : items;
  const onSale = visible.filter((item) => item.isActive);
  const discontinued = visible.filter((item) => !item.isActive);

  if (visible.length === 0) {
    return (
      <p className="py-16 text-center">
        Chưa có sản phẩm yêu thích.{" "}
        <Link href="/shop" className="underline">
          Xem sản phẩm
        </Link>
      </p>
    );
  }

  return (
    <>
      {onSale.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 pt-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {onSale.map((item) => (
            <ProductCard key={item._id} product={item} />
          ))}
        </div>
      )}

      {discontinued.length > 0 && (
        <section className="pt-12">
          <h2 className="border-b border-neutral-200 pb-3">Ngừng bán</h2>
          <ul>
            {discontinued.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between gap-4 border-b border-neutral-100 py-3"
              >
                <span className="min-w-0 uppercase text-neutral-600">
                  {item.name}
                </span>
                <WishlistButton productId={item._id} productName={item.name} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

export default WishlistView;
