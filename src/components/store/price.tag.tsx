import { formatVnd } from "@/utils/store";

interface IProps {
  // Giá bán: giá khách trả
  price: number;
  // Giá trước giảm: chỉ hiện gạch ngang khi lớn hơn giá bán
  originalPrice?: number | null;
  className?: string;
}

/** Giá bán, kèm giá trước giảm gạch ngang và phần trăm giảm khi đang giảm giá */
const PriceTag = ({ price, originalPrice, className = "" }: IProps) => {
  const isDiscounted = originalPrice != null && originalPrice > price;
  const percent = isDiscounted
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span>{formatVnd(price)}</span>
      {isDiscounted && (
        <>
          <s className="text-neutral-500">
            <span className="sr-only">Giá trước giảm </span>
            {formatVnd(originalPrice)}
          </s>
          {percent > 0 && <span className="text-red-600">-{percent}%</span>}
        </>
      )}
    </p>
  );
};

export default PriceTag;
