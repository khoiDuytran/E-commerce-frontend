import { getAuthHeader } from "@/utils/session";
import ProductTable, {
  ICategoryOption,
  IProduct,
} from "@/components/admin/product.table";
import { sendRequest } from "@/utils/api";

interface ProductListResponse {
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  results: IProduct[];
}

interface CategoryListResponse {
  results: ICategoryOption[];
}

interface IProps {
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
    name?: string;
    category?: string;
  }>;
}

const ManageProductPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;

  const current =
    typeof params.current === "string" && Number(params.current) > 0
      ? Number(params.current)
      : 1;

  const pageSize =
    typeof params.pageSize === "string" && Number(params.pageSize) > 0
      ? Number(params.pageSize)
      : 10;

  const name = typeof params.name === "string" ? params.name.trim() : "";
  const category =
    typeof params.category === "string" ? params.category.trim() : "";

  const headers = await getAuthHeader();

  let productResponse: IBackendRes<ProductListResponse> | undefined;
  let categoryResponse: IBackendRes<CategoryListResponse> | undefined;
  let requestError: string | undefined;

  try {
    const [prodRes, catRes] = await Promise.all([
      sendRequest<IBackendRes<ProductListResponse>>({
        // Endpoint admin: kèm giá nhập
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/product/admin/all`,
        method: "GET",
        queryParams: {
          current,
          pageSize,
          ...(name ? { name: `/${name}/i` } : {}),
          ...(category ? { category } : {}),
          sort: "-createdAt",
        },
        headers,
        nextOption: {
          next: { tags: ["list-products"] },
        },
      }),
      sendRequest<IBackendRes<CategoryListResponse>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category`,
        method: "GET",
        queryParams: { pageSize: 100 },
        headers,
        nextOption: {
          next: { tags: ["list-categories"] },
        },
      }),
    ]);

    productResponse = prodRes;
    categoryResponse = catRes;
  } catch (error) {
    requestError =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi kết nối với máy chủ.";
  }

  const categories = categoryResponse?.data?.results ?? [];

  if (requestError) {
    return (
      <ProductTable
        products={[]}
        categories={categories}
        error={requestError}
      />
    );
  }

  if (!productResponse?.data?.results || !productResponse.data.meta) {
    const responseError = Array.isArray(productResponse?.error)
      ? productResponse.error.join(", ")
      : productResponse?.error;
    return (
      <ProductTable
        products={[]}
        categories={categories}
        error={
          responseError ||
          productResponse?.message ||
          "Không thể tải danh sách sản phẩm từ hệ thống."
        }
      />
    );
  }

  return (
    <ProductTable
      products={productResponse.data.results}
      categories={categories}
      meta={productResponse.data.meta}
    />
  );
};

export default ManageProductPage;
