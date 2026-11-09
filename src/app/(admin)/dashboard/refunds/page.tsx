import RefundTable from "@/components/admin/refund.table";
import { sendRequest } from "@/utils/api";
import { getAuthHeader } from "@/utils/session";

interface RefundListResponse {
  meta: IPageMeta;
  results: IRefundRecord[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    orderCode?: string;
    status?: string;
  }>;
}

const REFUND_STATUSES: RefundStatus[] = [
  "REQUESTED",
  "APPROVED",
  "RECEIVED",
  "REFUNDED",
  "REJECTED",
];

const toPositiveInt = (value: string | undefined, fallback: number) =>
  value && Number.isInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : fallback;

// Mã đơn đưa vào regex của backend nên phải escape ký tự đặc biệt
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

const ManageRefundsPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;
  const current = toPositiveInt(params.current, 1);
  const pageSize = toPositiveInt(params.pageSize, 10);
  const orderCode = params.orderCode?.trim() ?? "";
  // Chỉ nhận đúng giá trị enum để không đưa chuỗi tùy ý vào filter
  const status = REFUND_STATUSES.find((value) => value === params.status);
  const emptyMeta: IPageMeta = { current, pageSize, pages: 0, total: 0 };
  const filters = { orderCode, status };

  let response: IBackendRes<RefundListResponse> | undefined;
  try {
    response = await sendRequest<IBackendRes<RefundListResponse>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/refunds/admin/all`,
      method: "GET",
      queryParams: {
        current,
        pageSize,
        sort: "-createdAt",
        ...(orderCode ? { orderCode: `/${escapeRegex(orderCode)}/i` } : {}),
        ...(status ? { status } : {}),
      },
      headers: await getAuthHeader(),
      nextOption: { next: { tags: ["list-refunds"] } },
    });
  } catch (error) {
    return (
      <RefundTable
        refunds={[]}
        meta={emptyMeta}
        filters={filters}
        error={
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ."
        }
      />
    );
  }

  if (!response?.data?.results || !response.data.meta) {
    const responseError = Array.isArray(response?.error)
      ? response.error.join(", ")
      : response?.error;
    return (
      <RefundTable
        refunds={[]}
        meta={emptyMeta}
        filters={filters}
        error={
          responseError ||
          response?.message ||
          `Yêu cầu tải danh sách hoàn hàng thất bại (HTTP ${response?.statusCode ?? "không xác định"}).`
        }
      />
    );
  }

  return (
    <RefundTable
      refunds={response.data.results}
      meta={response.data.meta}
      filters={filters}
    />
  );
};

export default ManageRefundsPage;
