import CheckoutForm from "@/components/store/checkout.form";
import { getMyAddresses, requireToken } from "@/utils/account.api";

const CheckoutPage = async () => {
  // Backend yêu cầu đăng nhập để tạo đơn; giỏ hàng vẫn còn sau khi đăng nhập
  const token = await requireToken("/checkout");
  const addresses = await getMyAddresses(token);

  return (
    <div className="pt-4">
      <h1 className="px-4 pb-6 md:px-10">Thanh toán</h1>
      <CheckoutForm addresses={addresses ?? []} />
    </div>
  );
};

export default CheckoutPage;
