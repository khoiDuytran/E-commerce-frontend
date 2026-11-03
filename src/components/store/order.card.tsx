"use client";

import {
  handleCancelOrderAction,
  handleCreateRefundAction,
} from "@/utils/actions";
import {
  formatDateTime,
  formatVnd,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  toErrorText,
} from "@/utils/store";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthError, AuthField, AuthSubmit } from "./auth.ui";
import OrderSummary from "./order.summary";
import RetryPaymentButton from "./retry.payment.button";

interface IProps {
  order: IStoreOrder;
  refund?: IStoreRefund;
  // Có khi đơn VNPay còn chờ thanh toán
  retryPaymentId?: string;
}

const CONNECTION_ERROR = "Không kết nối được máy chủ. Vui lòng thử lại.";

const OrderCard = ({ order, refund, retryPaymentId }: IProps) => {
  const router = useRouter();
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cùng điều kiện với backend; backend vẫn là nơi quyết định cuối cùng
  const canCancel =
    order.status === "PENDING" && order.paymentStatus === "UNPAID";
  const canRefund =
    order.status === "DELIVERED" && order.paymentStatus === "PAID" && !refund;

  const onCancel = async () => {
    if (!window.confirm(`Hủy đơn hàng ${order.orderCode}?`)) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await handleCancelOrderAction(order._id);
      if (res?.data) {
        router.refresh();
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestRefund = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = String(form.get("description")).trim();

    setError("");
    setIsSubmitting(true);
    try {
      const res = await handleCreateRefundAction({
        orderCode: order.orderCode,
        reason: String(form.get("reason")).trim(),
        ...(description && { description }),
      });
      if (res?.data) {
        setIsRefundFormOpen(false);
        router.refresh();
      } else {
        setError(toErrorText(res?.message));
      }
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <li className="border border-neutral-300 p-4">
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-neutral-200 pb-4">
        <div>
          <p>{order.orderCode}</p>
          <p className="mt-1 text-xs text-neutral-600">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="md:text-right">
          <p>{ORDER_STATUS_LABELS[order.status] ?? order.status}</p>
          <p className="mt-1 text-xs text-neutral-600">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </p>
        </div>
      </div>

      <OrderSummary order={order} />

      {refund && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <h3>
            Yêu cầu hoàn hàng:{" "}
            {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
          </h3>
          <p className="mt-2 text-neutral-600">Lý do: {refund.reason}</p>
          {refund.description && (
            <p className="mt-1 text-neutral-600">{refund.description}</p>
          )}
          <p className="mt-1 text-neutral-600">
            Số tiền hoàn: {formatVnd(refund.refundAmount)}
          </p>
          {refund.adminNote && (
            <p className="mt-1 text-neutral-600">
              Phản hồi của cửa hàng: {refund.adminNote}
            </p>
          )}
        </div>
      )}

      {order.status === "DELIVERED" && order.paymentStatus === "UNPAID" && (
        <p className="mt-4 text-xs text-neutral-600">
          Đơn chưa được ghi nhận thanh toán nên chưa thể yêu cầu hoàn hàng. Vui
          lòng liên hệ cửa hàng.
        </p>
      )}

      {!isRefundFormOpen && error && (
        <div className="mt-4">
          <AuthError message={error} />
        </div>
      )}

      {retryPaymentId && (
        <div className="mt-4">
          <RetryPaymentButton paymentId={retryPaymentId} />
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="mt-4 cursor-pointer underline disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Đang xử lý..." : "Hủy đơn hàng"}
        </button>
      )}

      {canRefund && !isRefundFormOpen && (
        <button
          type="button"
          onClick={() => setIsRefundFormOpen(true)}
          className="mt-4 cursor-pointer underline"
        >
          Yêu cầu hoàn hàng
        </button>
      )}

      {isRefundFormOpen && (
        <form
          onSubmit={onRequestRefund}
          className="mt-4 border-t border-neutral-200 pt-4"
        >
          <h3 className="pb-4">Yêu cầu hoàn hàng</h3>
          <AuthField label="Lý do" name="reason" required maxLength={500} />
          <label className="block pb-4">
            Mô tả thêm (không bắt buộc)
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="mt-2 block w-full border border-neutral-300 p-3 outline-none focus:border-black"
            />
          </label>
          <AuthError message={error} />
          <AuthSubmit isSubmitting={isSubmitting}>Gửi yêu cầu</AuthSubmit>
          <button
            type="button"
            onClick={() => {
              setError("");
              setIsRefundFormOpen(false);
            }}
            className="mt-4 cursor-pointer underline"
          >
            Hủy
          </button>
        </form>
      )}
    </li>
  );
};

export default OrderCard;
