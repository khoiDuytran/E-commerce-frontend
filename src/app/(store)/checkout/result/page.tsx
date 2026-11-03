import OrderSummary from "@/components/store/order.summary";
import RetryPaymentButton from "@/components/store/retry.payment.button";
import {
  canRetryPayment,
  getMyOrderByCode,
  getOrderPayment,
  getSessionToken,
} from "@/utils/account.api";
import { sendRequest } from "@/utils/api";
import {
  formatDateTime,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/utils/store";
import Link from "next/link";

interface IProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface IVnpayReturn {
  RspCode: string;
  orderCode?: string;
  responseCode?: string;
}

// Trạng thái thanh toán do backend xác thực chữ ký quyết định, không tin query trên URL
const verifyVnpayReturn = async (query: Record<string, string>) => {
  try {
    const res = await sendRequest<IBackendRes<IVnpayReturn>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/vnpay/return`,
      method: "GET",
      queryParams: query,
      nextOption: { cache: "no-store" },
    });
    return res?.data ?? null;
  } catch {
    return null;
  }
};

const getResultText = (
  order: IStoreOrder | null,
  isVnpay: boolean,
  isVnpayPaid: boolean,
  paymentMethod: string | null,
  isLoggedIn: boolean,
) => {
  if (isVnpay && !isVnpayPaid) {
    return {
      title: "Thanh toán chưa thành công",
      description:
        "Giao dịch chưa hoàn tất hoặc không xác thực được. Vui lòng liên hệ cửa hàng nếu tài khoản đã bị trừ tiền.",
    };
  }
  if (isVnpay) {
    return {
      title: "Thanh toán thành công",
      description: "Cảm ơn bạn đã mua sắm. Đơn hàng đang được xử lý.",
    };
  }
  if (!isLoggedIn) {
    return {
      title: "Kết quả đơn hàng",
      description: "Vui lòng đăng nhập để xem thông tin đơn hàng.",
    };
  }
  if (!order) {
    return {
      title: "Không tìm thấy đơn hàng",
      description: "Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.",
    };
  }
  if (order.status === "CANCELLED") {
    return { title: "Đơn hàng đã hủy", description: "" };
  }
  return {
    title: "Đặt hàng thành công",
    description:
      paymentMethod === "COD"
        ? "Bạn sẽ thanh toán khi nhận hàng. Cảm ơn bạn đã mua sắm."
        : "Cảm ơn bạn đã mua sắm.",
  };
};

const CheckoutResultPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;

  const vnpayQuery = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] =>
        entry[0].startsWith("vnp_") && typeof entry[1] === "string",
    ),
  );
  const isVnpay = Object.keys(vnpayQuery).length > 0;
  const vnpay = isVnpay ? await verifyVnpayReturn(vnpayQuery) : null;

  const isVnpayPaid = vnpay?.RspCode === "00" && vnpay.responseCode === "00";
  const rawCode = isVnpay ? vnpay?.orderCode : params.code;
  // Mã đơn đi vào đường dẫn gọi backend nên chỉ nhận đúng định dạng
  const orderCode =
    typeof rawCode === "string" && /^[A-Za-z0-9-]+$/.test(rawCode)
      ? rawCode
      : undefined;

  // Đọc đơn sau khi xác thực VNPay để thấy trạng thái thanh toán vừa cập nhật.
  // Backend chỉ trả đơn thuộc về tài khoản đang đăng nhập.
  const token = await getSessionToken();
  const order =
    token && orderCode ? await getMyOrderByCode(token, orderCode) : null;
  const payment =
    token && order ? await getOrderPayment(token, order._id) : null;
  const paymentMethod = payment?.method ?? null;
  const canRetry = order ? canRetryPayment(order, paymentMethod) : false;

  const { title, description } = getResultText(
    order,
    isVnpay,
    isVnpayPaid,
    paymentMethod,
    Boolean(token),
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-base">{title}</h1>
        {orderCode && <p className="mt-3">Mã đơn hàng: {orderCode}</p>}
        {description && (
          <p className="mt-3 text-neutral-600">{description}</p>
        )}
      </div>

      {order && (
        <section className="mt-10">
          <h2 className="border-b border-neutral-200 pb-4">
            Thông tin đơn hàng
          </h2>
          <dl className="space-y-2 border-b border-neutral-200 py-4">
            <div className="flex justify-between gap-4">
              <dt>Ngày đặt</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Trạng thái</dt>
              <dd>{ORDER_STATUS_LABELS[order.status] ?? order.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Thanh toán</dt>
              <dd>
                {paymentMethod && `${paymentMethod} · `}
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                  order.paymentStatus}
              </dd>
            </div>
          </dl>
          <OrderSummary order={order} />
        </section>
      )}

      <div className="mt-10 flex flex-col items-center gap-4">
        {canRetry && payment && (
          <RetryPaymentButton
            paymentId={payment._id}
            className="w-full cursor-pointer border border-black p-3 text-center transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          />
        )}
        <Link
          href="/"
          className="w-full bg-black p-3 text-center text-white transition-opacity hover:opacity-70"
        >
          Quay lại trang chủ
        </Link>
        {token ? (
          <Link href="/account/orders" className="underline">
            Xem đơn hàng của tôi
          </Link>
        ) : (
          orderCode && (
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(`/checkout/result?code=${orderCode}`)}`}
              className="underline"
            >
              Đăng nhập
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default CheckoutResultPage;
