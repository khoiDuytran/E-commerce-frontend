"use client";

import { PointerEvent, useRef, useState } from "react";
import StoreImage from "./store.image";

interface IProps {
  images: { src: string; alt: string }[];
}

const StockistGallery = ({ images }: IProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const dragRef = useRef({ startX: 0, startScroll: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Cảm ứng đã vuốt được sẵn, chỉ chuột mới cần tự xử lý kéo
  const onPointerDown = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
    };
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLUListElement>) => {
    if (!isDragging) return;
    const { startX, startScroll } = dragRef.current;
    event.currentTarget.scrollLeft = startScroll - (event.clientX - startX);
  };

  // Thả chuột thì trượt về ảnh gần nhất, thêm vị trí cuối để không bị kéo lùi khi đã hết ảnh
  const onPointerRelease = () => {
    const list = listRef.current;
    if (!isDragging || !list) return;
    setIsDragging(false);

    const padding = parseFloat(getComputedStyle(list).paddingLeft);
    const maxScroll = list.scrollWidth - list.clientWidth;
    const positions = [...list.children].map((item) =>
      Math.min((item as HTMLElement).offsetLeft - padding, maxScroll),
    );
    const nearest = positions.reduce((best, position) =>
      Math.abs(position - list.scrollLeft) < Math.abs(best - list.scrollLeft)
        ? position
        : best,
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollTo({ left: nearest, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <ul
      ref={listRef}
      tabIndex={0}
      aria-label="Ảnh cửa hàng, kéo ngang để xem thêm"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerRelease}
      onPointerCancel={onPointerRelease}
      onDragStart={(event) => event.preventDefault()}
      className={`relative flex gap-5 overflow-x-auto px-4 outline-none [scrollbar-width:none] select-none focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-black md:px-10 pointer-coarse:snap-x pointer-coarse:snap-mandatory pointer-coarse:scroll-px-4 pointer-fine:cursor-grab ${isDragging ? "pointer-fine:cursor-grabbing" : ""
        }`}
    >
      {images.map((image) => (
        // Từ md, ba ảnh và hai khoảng cách gap-5 vừa đủ chiều rộng; ảnh kế tiếp chỉ lộ ở lề phải
        <li
          key={image.src}
          className="relative aspect-4/5 w-[85%] shrink-0 snap-start bg-neutral-100 md:w-[calc((100%-1.25rem)/3)]"
        >
          <StoreImage
            src={image.src}
            alt={image.alt}
            sizes="(min-width: 768px) 35vw, 85vw"
            cover
          />
        </li>
      ))}
    </ul>
  );
};

export default StockistGallery;
