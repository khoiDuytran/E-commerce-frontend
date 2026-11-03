import { sendRequest } from "./api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface IListResult<T> {
  results: T[];
  meta?: IPageMeta;
  failed: boolean;
}

// Luôn lấy dữ liệu mới theo từng request; backend lỗi thì trang vẫn hiển thị được
const fetchList = async <T>(
  path: string,
  queryParams: object,
): Promise<IListResult<T>> => {
  try {
    const res = await sendRequest<
      IBackendRes<{ results: T[]; meta: IPageMeta }>
    >({
      url: `${BACKEND_URL}/api/${path}`,
      method: "GET",
      queryParams,
      nextOption: { cache: "no-store" },
    });
    if (!res?.data?.results) return { results: [], failed: true };
    return { results: res.data.results, meta: res.data.meta, failed: false };
  } catch {
    return { results: [], failed: true };
  }
};

export const getStoreProducts = (query: object) =>
  fetchList<IStoreProduct>("product", { isActive: true, ...query });

export const getStoreProductBySlug = async (slug: string) => {
  const { results } = await fetchList<IStoreProduct>("product", {
    isActive: true,
    slug,
    pageSize: 1,
  });
  return results[0] ?? null;
};

export const getStoreVariants = async (productId: string) => {
  const { results } = await fetchList<IStoreVariant>("product-variants", {
    isActive: true,
    product: productId,
    pageSize: 100,
  });
  return results;
};

export const getStoreCategories = async () => {
  const { results } = await fetchList<IStoreCategory>("category", {
    isActive: true,
    pageSize: 100,
  });
  return results;
};
