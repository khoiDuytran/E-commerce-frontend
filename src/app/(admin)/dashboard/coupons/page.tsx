import { auth } from "@/auth";
import CouponTable from "@/components/admin/coupon.table";
import { sendRequest } from "@/utils/api";

interface Coupon {
  _id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CouponListResponse {
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  results: Coupon[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    code?: string;
  }>;
}

const ManageCouponsPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;
  const current =
    params.current &&
    Number.isInteger(Number(params.current)) &&
    Number(params.current) > 0
      ? Number(params.current)
      : 1;
  const pageSize =
    params.pageSize &&
    Number.isInteger(Number(params.pageSize)) &&
    Number(params.pageSize) > 0
      ? Number(params.pageSize)
      : 10;
  const code = params.code?.trim() ?? "";
  const session = await auth();

  let response: IBackendRes<CouponListResponse> | undefined;
  let requestError: string | undefined;
  try {
    response = await sendRequest<IBackendRes<CouponListResponse>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon`,
      method: "GET",
      queryParams: {
        current,
        pageSize,
        ...(code ? { code } : {}),
      },
      headers: {
        Authorization: `Bearer ${session?.user.access_token}`,
      },
      nextOption: {
        next: { tags: ["list-coupons"] },
      },
    });
  } catch (error) {
    requestError =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi kết nối máy chủ.";
  }

  if (requestError) {
    return <CouponTable coupons={[]} error={requestError} />;
  }

  if (!response?.data?.results || !response.data.meta) {
    const responseError = Array.isArray(response?.error)
      ? response.error.join(", ")
      : response?.error;
    return (
      <CouponTable
        coupons={[]}
        error={
          responseError ||
          response?.message ||
          `Yêu cầu tải coupon thất bại (HTTP ${response?.statusCode ?? "không xác định"}).`
        }
      />
    );
  }

  return (
    <CouponTable coupons={response.data.results} meta={response.data.meta} />
  );
};

export default ManageCouponsPage;
