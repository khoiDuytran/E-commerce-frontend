import BannerTable from "@/components/admin/banner.table";
import { sendRequest } from "@/utils/api";
import { getAuthHeader } from "@/utils/session";

interface BannerListResponse {
  meta: IPageMeta;
  results: IBannerRecord[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    title?: string;
  }>;
}

const toPositiveInt = (value: string | undefined, fallback: number) =>
  value && Number.isInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : fallback;

// Tiêu đề đưa vào regex của backend nên phải escape ký tự đặc biệt
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

const ManageBannersPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;
  const current = toPositiveInt(params.current, 1);
  const pageSize = toPositiveInt(params.pageSize, 10);
  const title = params.title?.trim() ?? "";
  const emptyMeta: IPageMeta = { current, pageSize, pages: 0, total: 0 };

  let response: IBackendRes<BannerListResponse> | undefined;
  try {
    response = await sendRequest<IBackendRes<BannerListResponse>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/banner`,
      method: "GET",
      queryParams: {
        current,
        pageSize,
        sort: "sortOrder,-createdAt",
        ...(title ? { title: `/${escapeRegex(title)}/i` } : {}),
      },
      headers: await getAuthHeader(),
      nextOption: { next: { tags: ["list-banners"] } },
    });
  } catch (error) {
    return (
      <BannerTable
        banners={[]}
        meta={emptyMeta}
        searchTitle={title}
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
      <BannerTable
        banners={[]}
        meta={emptyMeta}
        searchTitle={title}
        error={
          responseError ||
          response?.message ||
          `Yêu cầu tải banner thất bại (HTTP ${response?.statusCode ?? "không xác định"}).`
        }
      />
    );
  }

  return (
    <BannerTable
      banners={response.data.results}
      meta={response.data.meta}
      searchTitle={title}
    />
  );
};

export default ManageBannersPage;
