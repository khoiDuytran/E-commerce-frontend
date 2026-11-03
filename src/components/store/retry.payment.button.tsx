"use client";

import { handleRetryPaymentAction } from "@/utils/actions";
import { toErrorText } from "@/utils/store";
import { useState } from "react";
import { AuthError } from "./auth.ui";

const RetryPaymentButton = ({
  paymentId,
  className = "cursor-pointer underline disabled:cursor-not-allowed",
}: {
  paymentId: string;
  className?: string;
}) => {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRetry = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await handleRetryPaymentAction(paymentId);
      const checkoutUrl = res?.data?.paymentInfo?.checkoutUrl;
      if (checkoutUrl) {
        // Giữ nút khóa trong lúc trình duyệt chuyển sang cổng thanh toán
        window.location.assign(checkoutUrl);
        return;
      }
      setError(toErrorText(res?.message));
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <AuthError message={error} />
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onRetry}
        className={className}
      >
        {isSubmitting ? "Đang chuyển sang VNPay..." : "Thanh toán lại qua VNPay"}
      </button>
    </div>
  );
};

export default RetryPaymentButton;
