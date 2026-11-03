"use client";

import { addCartItem } from "@/library/cart.store";
import Link from "next/link";
import { useState } from "react";
import PriceTag from "./price.tag";
import StoreImage from "./store.image";
import WishlistButton from "./wishlist.button";

interface IProps {
  product: IStoreProduct;
  variants: IStoreVariant[];
}

const OPTION_LABELS: Record<string, string> = {
  color: "Màu",
  size: "Size",
  name: "Phân loại",
};

// Áp dụng chung cho mọi sản phẩm nên không lưu trong database
const CARE_INSTRUCTIONS = `- Hạn chế giặt máy
- Hạn chế chất tẩy rửa mạnh

- Avoid machine washing.
- Avoid harsh detergents.`;

const SHIPPING_RETURNS = `- Giao hàng tiêu chuẩn 2-4 ngày làm việc.
- Hỗ trợ đổi size trong vòng 3 ngày kể từ khi nhận hàng (sản phẩm nguyên tag/mác).

- Standard delivery: 2–4 business days.
- Size exchange or product exchange of equal or higher value supported within 3 days of receipt (product must have original tags attached).`;

// Biến thể không khai báo thuộc tính thì chọn theo tên
const getOptions = (variant: IStoreVariant): Record<string, string> =>
  Object.keys(variant.attributes ?? {}).length > 0
    ? variant.attributes
    : { name: variant.name };

const ProductDetail = ({ product, variants }: IProps) => {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const infoSections = [
    { key: "size", title: "Size", content: product.sizeGuide },
    { key: "details", title: "Details & Fit", content: product.detailsFit },
    { key: "care", title: "Fabric & Care", content: CARE_INSTRUCTIONS },
    { key: "shipping", title: "Shipping & Returns", content: SHIPPING_RETURNS },
  ].filter((section) => section.content?.trim());

  const toggleSection = (key: string) =>
    setOpenSections((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  const openSizeGuide = () => {
    setOpenSections((current) =>
      current.includes("size") ? current : [...current, "size"],
    );
    document
      .getElementById("product-info-size")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const optionKeys = [
    ...new Set(variants.flatMap((variant) => Object.keys(getOptions(variant)))),
  ];
  const matchedVariant = variants.find((variant) => {
    const options = getOptions(variant);
    return optionKeys.every((key) => options[key] === selected[key]);
  });

  const hasVariants = variants.length > 0;
  const images = matchedVariant?.images?.length
    ? matchedVariant.images
    : product.images;
  const currentImage = images[imageIndex] ?? images[0];
  const price = matchedVariant?.price ?? product.basePrice;
  // Đã chọn biến thể thì chỉ dùng giá trước giảm của biến thể đó: giá trước giảm của sản phẩm
  // không đi cùng giá bán riêng của biến thể
  const originalPrice = matchedVariant
    ? matchedVariant.originalPrice
    : product.originalPrice;
  const stock = hasVariants ? (matchedVariant?.stock ?? 0) : product.stock;
  const isChoosing = hasVariants && !matchedVariant;

  // Giá trị còn mua được khi giữ nguyên các lựa chọn khác
  const isOptionAvailable = (key: string, value: string) =>
    variants.some((variant) => {
      const options = getOptions(variant);
      return (
        variant.stock > 0 &&
        options[key] === value &&
        optionKeys.every(
          (other) =>
            other === key ||
            !selected[other] ||
            options[other] === selected[other],
        )
      );
    });

  const selectOption = (key: string, value: string) => {
    setSelected({ ...selected, [key]: value });
    setImageIndex(0);
    setIsAdded(false);
  };

  const onAddToCart = () => {
    addCartItem({
      productId: product._id,
      variantId: matchedVariant?._id,
      slug: product.slug,
      name: product.name,
      variantName: matchedVariant?.name,
      image: images[0],
      price,
      quantity: 1,
      maxQuantity: stock,
    });
    setIsAdded(true);
  };

  const buttonLabel = isChoosing
    ? "Chọn phân loại"
    : stock === 0
      ? "Hết hàng"
      : "Thêm vào giỏ";

  return (
    <div className="grid gap-8 px-4 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,38%)] md:gap-14 md:px-10">
      <div className="flex flex-col-reverse gap-4 md:flex-row">
        {images.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto md:w-16 md:flex-col">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={image === currentImage ? "true" : undefined}
                className={`relative aspect-[4/5] w-16 shrink-0 cursor-pointer border ${
                  image === currentImage
                    ? "border-black"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <StoreImage src={image} alt="" sizes="64px" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-[4/5] w-full md:max-h-[85dvh]">
          <StoreImage
            src={currentImage}
            alt={product.name}
            sizes="(min-width: 768px) 60vw, 100vw"
          />
        </div>
      </div>

      <div className="md:sticky md:top-24 md:self-start">
        <h1 className="uppercase">{product.name}</h1>
        <PriceTag price={price} originalPrice={originalPrice} className="mt-2" />

        {product.description && (
          <p className="mt-6 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        )}

        {optionKeys.map((key) => (
          <fieldset key={key} className="mt-6">
            <legend className="mb-2">
              {OPTION_LABELS[key] ?? key}:{" "}
              <span className="text-neutral-600">{selected[key]}</span>
            </legend>
            {key === "size" && product.sizeGuide?.trim() && (
              <div className="-mt-7 mb-2 text-right">
                <button
                  type="button"
                  onClick={openSizeGuide}
                  className="cursor-pointer text-xs text-neutral-600 underline hover:text-black"
                >
                  Size Guide
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                ...new Set(
                  variants
                    .map((variant) => getOptions(variant)[key])
                    .filter(Boolean),
                ),
              ].map((value) => {
                const isAvailable = isOptionAvailable(key, value);
                const isSelected = selected[key] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    onClick={() => selectOption(key, value)}
                    className={`min-w-11 rounded-full border px-4 py-2 text-xs ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 hover:border-black"
                    } ${
                      isAvailable
                        ? "cursor-pointer"
                        : "cursor-not-allowed border-neutral-200 text-neutral-400 line-through hover:border-neutral-200"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <button
          type="button"
          disabled={isChoosing || stock === 0}
          onClick={onAddToCart}
          className="mt-6 w-full cursor-pointer rounded-full bg-black py-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-700"
        >
          {buttonLabel}
        </button>
        <div className="mt-3">
          <WishlistButton
            productId={product._id}
            productName={product.name}
            variant="full"
          />
        </div>
        <p aria-live="polite" className="mt-3 min-h-5 text-xs">
          {isAdded && (
            <>
              Đã thêm vào giỏ.{" "}
              <Link href="/cart" className="underline">
                Xem giỏ hàng
              </Link>
            </>
          )}
        </p>

        {infoSections.length > 0 && (
          <div className="mt-4 border-t border-neutral-200">
            {infoSections.map(({ key, title, content }) => {
              const isOpen = openSections.includes(key);
              return (
                <div
                  key={key}
                  id={`product-info-${key}`}
                  className="border-b border-neutral-200"
                >
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`product-info-${key}-content`}
                      onClick={() => toggleSection(key)}
                      className="flex w-full cursor-pointer items-center justify-between py-4 text-left"
                    >
                      {title}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 12 12"
                        className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          d="M2 4l4 4 4-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                  </h2>
                  <div
                    id={`product-info-${key}-content`}
                    hidden={!isOpen}
                    className="pb-4 leading-relaxed whitespace-pre-line text-neutral-600"
                  >
                    {content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
