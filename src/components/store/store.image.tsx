import Image from "next/image";

interface IProps {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  cover?: boolean;
}

// Dữ liệu cũ có URL do admin nhập tự do; next/image sẽ làm hỏng cả trang nếu src không hợp lệ
const isUsableSrc = (src?: string): src is string =>
  !!src && /^(https?:\/\/|\/)/.test(src);

const StoreImage = ({ src, alt, sizes, className = "", cover }: IProps) =>
  isUsableSrc(src) ? (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      className={`${cover ? "object-cover" : "object-contain"} ${className}`}
    />
  ) : (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 bg-neutral-100 ${className}`}
    />
  );

export default StoreImage;
