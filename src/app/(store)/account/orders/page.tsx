import OrderCard from "@/components/store/order.card";
import {
  canRetryPayment,
  getMyOrderByCode,
  getMyOrders,
  getMyRefunds,
  getOrderPayment,
  requireToken,
} from "@/utils/account.api";
import { ORDER_TABS } from "@/utils/store";
import Link from "next/link";

interface IProps {
  searchParams: Promise<{ status?: string; current?: string; code?: string }>;
}

const PAGE_SIZE = 10;

// Mã đơn do backend sinh: ORD-<base36>-<hex>. Kiểm tra trước khi đưa vào URL của API
const ORDER_CODE_PATTERN = /^ORD-[A-Z0-9]{1,20}-[A-F0-9]{1,20}$/i;

const OrdersPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;

  // Mở từ thông báo: chỉ hiện đúng đơn đó
  const orderCode =
    typeof params.code === "string" && ORDER_CODE_PATTERN.test(params.code)
      ? params.code
      : null;

  // Chỉ nhận key trong danh sách để giá trị từ URL không đi thẳng vào filter của backend
  const tab =
    ORDER_TABS.find((item) => item.key === params.status) ?? ORDER_TABS[0];
  const current = Math.max(Number(params.current) || 1, 1);

  const callbackPath = orderCode
    ? `/account/orders?code=${encodeURIComponent(orderCode)}`
    : tab === ORDER_TABS[0]
      ? "/account/orders"
      : `/account/orders?status=${tab.key}`;
  const token = await requireToken(callbackPath);

  const orders = orderCode
    ? await getMyOrderByCode(token, orderCode).then((order) => ({
      results: order ? [order] : [],
      meta: { current: 1, pageSize: 1, pages: 1, total: order ? 1 : 0 },
    }))
    : await getMyOrders(token, {
      current,
      pageSize: PAGE_SIZE,
      ...(tab.statuses.length > 0 && { status: tab.statuses.join(",") }),
    });

  // Chỉ đơn đã vào luồng hoàn hàng mới có yêu cầu hoàn
  const refundCodes = (orders?.results ?? [])
    .filter((order) => order.status.startsWith("RETURN_") || order.status === "REFUNDED")
    .map((order) => order.orderCode);
  const refunds = await getMyRefunds(token, refundCodes);

  // Chỉ đơn chưa thanh toán mới cần biết phương thức; mỗi đơn một lời gọi nhưng tối đa PAGE_SIZE
  const payments = new Map(
    await Promise.all(
      (orders?.results ?? [])
        .filter(
          (order) => order.paymentStatus === "UNPAID" && order.status !== "CANCELLED",
        )
        .map(
          async (order) =>
            [order._id, await getOrderPayment(token, order._id)] as const,
        ),
    ),
  );

  const buildHref = (key: string, page = 1) => {
    const query = new URLSearchParams();
    if (key !== ORDER_TABS[0].key) query.set("status", key);
    if (page > 1) query.set("current", String(page));
    const text = query.toString();
    return text ? `/account/orders?${text}` : "/account/orders";
  };

  const pages = orders?.meta?.pages ?? 1;

  return (
    <>
      <h1 className="border-b border-neutral-200 pb-4">
        {orderCode ? `Đơn hàng ${orderCode}` : "Đơn hàng"}
      </h1>

      {orderCode ? (
        <p className="py-6">
          <Link href="/account/orders" className="hover:underline">
            Xem tất cả đơn hàng
          </Link>
        </p>
      ) : (
      <nav
        aria-label="Trạng thái đơn hàng"
        className="flex flex-wrap gap-x-4 gap-y-2 py-6"
      >
        {ORDER_TABS.map((item) => (
          <Link
            key={item.key}
            href={buildHref(item.key)}
            aria-current={item.key === tab.key ? "page" : undefined}
            className={
              item.key === tab.key
                ? "underline"
                : "transition-opacity hover:opacity-50"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      )}

      {!orders ? (
        <p role="alert" className="py-16 text-center">
          Không tải được đơn hàng. Vui lòng thử lại sau.
        </p>
      ) : orders.results.length === 0 ? (
        <p className="py-16 text-center">
          {orderCode ? "Không tìm thấy đơn hàng này." : "Chưa có đơn hàng nào."}
        </p>
      ) : (
        <ul className="space-y-6">
          {orders.results.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              retryPaymentId={
                canRetryPayment(order, payments.get(order._id)?.method)
                  ? payments.get(order._id)?._id
                  : undefined
              }
              refund={refunds.find(
                (refund) => refund.orderCode === order.orderCode,
              )}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav
          aria-label="Phân trang"
          className="flex items-center justify-center gap-6 pt-10"
        >
          {current > 1 && (
            <Link
              href={buildHref(tab.key, current - 1)}
              className="hover:underline"
            >
              Trang trước
            </Link>
          )}
          <span className="text-neutral-600">
            {current} / {pages}
          </span>
          {current < pages && (
            <Link
              href={buildHref(tab.key, current + 1)}
              className="hover:underline"
            >
              Trang sau
            </Link>
          )}
        </nav>
      )}
    </>
  );
};

export default OrdersPage;
