import { auth } from "@/auth";
import OrderTable from "@/components/admin/order.table";
import { IOrder } from "@/components/admin/order.detail.drawer";
import { sendRequest } from "@/utils/api";

interface OrderListResponse {
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  results: IOrder[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    orderCode?: string;
    status?: string;
    paymentStatus?: string;
  }>;
}

const ManageOrdersPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;

  const current =
    typeof params.current === "string" && Number(params.current) > 0
      ? Number(params.current)
      : 1;

  const pageSize =
    typeof params.pageSize === "string" && Number(params.pageSize) > 0
      ? Number(params.pageSize)
      : 10;

  const orderCode =
    typeof params.orderCode === "string" ? params.orderCode.trim() : "";
  const status =
    typeof params.status === "string" ? params.status.trim() : "";
  const paymentStatus =
    typeof params.paymentStatus === "string" ? params.paymentStatus.trim() : "";

  const session = await auth();
  const token = session?.access_token || session?.user?.access_token;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let response: IBackendRes<OrderListResponse> | undefined;
  let requestError: string | undefined;

  try {
    response = await sendRequest<IBackendRes<OrderListResponse>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/admin/all`,
      method: "GET",
      queryParams: {
        current,
        pageSize,
        ...(orderCode ? { orderCode: `/${orderCode}/i` } : {}),
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        sort: "-createdAt",
      },
      headers,
      nextOption: {
        next: { tags: ["list-orders"] },
      },
    });
  } catch (error) {
    requestError =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi kết nối với máy chủ.";
  }

  if (requestError) {
    return <OrderTable orders={[]} error={requestError} />;
  }

  if (!response?.data?.results || !response.data.meta) {
    const responseError = Array.isArray(response?.error)
      ? response.error.join(", ")
      : response?.error;
    return (
      <OrderTable
        orders={[]}
        error={
          responseError ||
          response?.message ||
          "Không thể tải danh sách đơn hàng từ hệ thống."
        }
      />
    );
  }

  return (
    <OrderTable
      orders={response.data.results}
      meta={response.data.meta}
    />
  );
};

export default ManageOrdersPage;

