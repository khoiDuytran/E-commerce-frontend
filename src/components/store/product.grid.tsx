"use client";

import Link from "next/link";
import { CSSProperties, useState } from "react";
import PriceTag from "./price.tag";
import StoreImage from "./store.image";
import WishlistButton from "./wishlist.button";

export interface ISortLink {
  label: string;
  href: string;
  active: boolean;
}

interface IProps {
  products: IStoreProduct[];
  sortLinks: ISortLink[];
}

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 6;

export const ProductCard = ({
  product,
  onRemovedFromWishlist,
}: {
  product: IStoreProduct;
  onRemovedFromWishlist?: () => void;
}) => {
  const [firstImage, hoverImage] = product.images;
  // stock của sản phẩm là tổng tồn các biến thể đang bật (backend đồng bộ)
  const isSoldOut = product.stock <= 0;

  return (
    // Nút yêu thích nằm cạnh link, không lồng trong thẻ <a>
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden">
          <StoreImage
            src={firstImage}
            alt={product.name}
            sizes="(min-width: 768px) 25vw, 50vw"
          />
          {hoverImage && !isSoldOut && (
            <StoreImage
              src={hoverImage}
              alt=""
              sizes="(min-width: 768px) 25vw, 50vw"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          {/* Lớp phủ hết hàng: vẫn nằm trong link để khách bấm xem chi tiết */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-md">
              <span className="text-xs font-medium text-black">
                Out Of Stock
              </span>
            </div>
          )}
        </div>
        <h2 className="mt-3 uppercase">{product.name}</h2>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
          <PriceTag
            price={product.basePrice}
            originalPrice={product.originalPrice}
          />
          {isSoldOut && <span className="text-neutral-600">Hết hàng</span>}
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <WishlistButton
          productId={product._id}
          productName={product.name}
          onRemoved={onRemovedFromWishlist}
        />
      </div>
    </div>
  );
};

const ProductGrid = ({ products, sortLinks }: IProps) => {
  const [columns, setColumns] = useState(5);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-10 text-xs">
        <label className="hidden items-center gap-3 md:flex">
          <input
            type="range"
            min={MIN_COLUMNS}
            max={MAX_COLUMNS}
            value={columns}
            onChange={(event) => setColumns(Number(event.target.value))}
            aria-label="Số cột hiển thị"
            className="w-28 cursor-pointer accent-black"
          />
          <span className="text-neutral-600">{columns} cột</span>
        </label>
        <nav aria-label="Sắp xếp" className="flex flex-wrap gap-x-4 gap-y-1">
          {sortLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.active ? "true" : undefined}
              className={
                link.active ? "underline" : "text-neutral-600 hover:text-black"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        style={{ "--store-columns": columns } as CSSProperties}
        className="grid grid-cols-2 gap-x-4 gap-y-12 md:[grid-template-columns:repeat(var(--store-columns),minmax(0,1fr))] md:gap-x-6"
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductGrid;
