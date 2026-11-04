import { getAuthHeader } from "@/utils/session";
import CategoryTable from "@/components/admin/category.table";
import { sendRequest } from "@/utils/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive: boolean;
}

interface CategoryListResponse {
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  results: Category[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    name?: string;
  }>;
}

const ManageCategoriesPage = async ({ searchParams }: IProps) => {
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
  const name = params.name?.trim() ?? "";
  const authHeader = await getAuthHeader();

  let response: IBackendRes<CategoryListResponse> | undefined;
  let requestError: string | undefined;
  try {
    response = await sendRequest<IBackendRes<CategoryListResponse>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 100,
      },
      headers: authHeader,
      nextOption: {
        next: { tags: ["list-categories"] },
      },
    });
    if (response?.data?.results && response.data.meta) {
      for (let page = 2; page <= response.data.meta.pages; page += 1) {
        const nextResponse = await sendRequest<IBackendRes<CategoryListResponse>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category`,
          method: "GET",
          queryParams: { current: page, pageSize: 100 },
          headers: authHeader,
          nextOption: {
            next: { tags: ["list-categories"] },
          },
        });
        if (!nextResponse?.data?.results || !nextResponse.data.meta) {
          const responseError = Array.isArray(nextResponse?.error)
            ? nextResponse.error.join(", ")
            : nextResponse?.error;
          throw new Error(
            responseError ||
              nextResponse?.message ||
              `Không thể tải trang danh mục ${page}.`,
          );
        }
        response.data.results.push(...nextResponse.data.results);
      }
    }
  } catch (error) {
    requestError =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi kết nối máy chủ.";
  }

  if (requestError) {
    return (
      <CategoryTable
        categories={[]}
        current={current}
        pageSize={pageSize}
        searchName={name}
        error={requestError}
      />
    );
  }

  if (!response?.data?.results || !response.data.meta) {
    const responseError = Array.isArray(response?.error)
      ? response.error.join(", ")
      : response?.error;
    return (
      <CategoryTable
        categories={[]}
        current={current}
        pageSize={pageSize}
        searchName={name}
        error={
          responseError ||
          response?.message ||
          `Yêu cầu tải danh mục thất bại (HTTP ${response?.statusCode ?? "không xác định"}).`
        }
      />
    );
  }

  return (
    <CategoryTable
      categories={response.data.results}
      current={current}
      pageSize={pageSize}
      searchName={name}
    />
  );
};

export default ManageCategoriesPage;
