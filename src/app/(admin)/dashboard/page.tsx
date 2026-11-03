"use server";

import { auth } from "@/auth";
import DashboardStats, { IDashboardStats } from "@/components/admin/dashboard.stats";
import { sendRequest } from "@/utils/api";

const DashboardPage = async () => {
  const session = await auth();
  const token = session?.access_token || session?.user?.access_token;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let response: IBackendRes<IDashboardStats> | undefined;
  let requestError: string | undefined;

  try {
    response = await sendRequest<IBackendRes<IDashboardStats>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/stats`,
      method: "GET",
      headers,
      nextOption: {
        next: { tags: ["dashboard-stats"], revalidate: 60 },
      },
    });
  } catch (error) {
    requestError =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi kết nối với máy chủ.";
  }

  if (requestError) {
    return <DashboardStats error={requestError} />;
  }

  if (!response?.data?.kpi) {
    const responseError = Array.isArray(response?.error)
      ? response.error.join(", ")
      : response?.error;
    return (
      <DashboardStats
        error={
          responseError ||
          response?.message ||
          "Không thể tải dữ liệu thống kê từ hệ thống."
        }
      />
    );
  };

  return <DashboardStats data={response.data} />;
};

export default DashboardPage;
