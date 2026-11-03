import { formatVnd } from "@/utils/store";
import StoreImage from "./store.image";

const OrderSummary = ({ order }: { order: IStoreOrder }) => {
  const { shippingAddress: address } = order;

  return (
    <div>
      <ul>
        {order.items.map((item, index) => (
          // Đơn có thể chứa hai dòng cùng tên nên ghép thêm vị trí vào key
          <li
            key={`${item.productName}-${item.variantName ?? ""}-${index}`}
            className="flex gap-4 border-b border-neutral-200 py-4"
          >
            <div className="relative aspect-square w-14 shrink-0">
              <StoreImage
                src={item.image}
                alt={item.productName}
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="uppercase">{item.productName}</p>
              <p className="mt-1 text-xs text-neutral-600">
                {item.variantName && `${item.variantName} · `}SL:{" "}
                {item.quantity}
              </p>
            </div>
            <span>{formatVnd(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2">
        <div className="flex justify-between gap-4">
          <dt>Tạm tính</dt>
          <dd>{formatVnd(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between gap-4">
            <dt>Giảm giá</dt>
            <dd>-{formatVnd(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt>Phí vận chuyển</dt>
          <dd>{formatVnd(order.shippingFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-neutral-200 pt-2 font-medium">
          <dt>Tổng cộng</dt>
          <dd>{formatVnd(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-4 text-neutral-600">
        <p>
          Giao tới: {address.fullName} · {address.phone}
        </p>
        <p className="mt-1">
          {address.detail}, {address.ward}, {address.district},{" "}
          {address.province}
        </p>
        {order.note && <p className="mt-1">Ghi chú: {order.note}</p>}
      </div>
    </div>
  );
};

export default OrderSummary;
