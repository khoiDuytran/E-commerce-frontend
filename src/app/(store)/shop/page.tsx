import ProductGrid, { ISortLink } from "@/components/store/product.grid";
import { getCategoryTreeIds } from "@/utils/store";
import { getStoreCategories, getStoreProducts } from "@/utils/store.api";
import Link from "next/link";

interface IProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    current?: string;
  }>;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { key: "new", label: "Mới nhất", value: "-createdAt" },
  { key: "best", label: "Bán chạy", value: "-soldCount" },
  { key: "asc", label: "Giá: Thấp đến cao", value: "basePrice" },
  { key: "desc", label: "Giá: Cao đến thấp", value: "-basePrice" },
];

// Từ khóa thành regex an toàn: bỏ dấu phẩy vì aqp hiểu là danh sách giá trị
const toNameFilter = (keyword: string) =>
  `/${keyword.replace(/,/g, " ").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/i`;

const ShopPage = async ({ searchParams }: IProps) => {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category =
    typeof params.category === "string" &&
    /^[a-f\d]{24}$/i.test(params.category)
      ? params.category
      : undefined;
  const sort =
    SORT_OPTIONS.find((option) => option.key === params.sort) ??
    SORT_OPTIONS[0];
  const current = Math.max(Number(params.current) || 1, 1);

  const categories = await getStoreCategories();

  const { results, meta, failed } = await getStoreProducts({
    current,
    pageSize: PAGE_SIZE,
    sort: sort.value,
    ...(category && {
      category: getCategoryTreeIds(categories, category).join(","),
    }),
    ...(q && { name: toNameFilter(q) }),
  });

  const buildHref = (updates: { sort?: string; current?: number }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    const nextSort = updates.sort ?? sort.key;
    if (nextSort !== SORT_OPTIONS[0].key) query.set("sort", nextSort);
    if (updates.current && updates.current > 1) {
      query.set("current", String(updates.current));
    }
    const text = query.toString();
    return text ? `/shop?${text}` : "/shop";
  };

  const sortLinks: ISortLink[] = SORT_OPTIONS.map((option) => ({
    label: option.label,
    href: buildHref({ sort: option.key }),
    active: option.key === sort.key,
  }));

  const pages = meta?.pages ?? 1;

  return (
    <div className="px-4 pt-4 pb-16 md:px-10">
      <h1 className="sr-only">{q ? `Kết quả cho "${q}"` : "Cửa hàng"}</h1>
      {q && <p className="pb-6">Kết quả cho &quot;{q}&quot;</p>}

      {/* Màn hình cảm ứng không rê chuột được nên không mở được menu danh mục ở header */}
      <nav
        aria-label="Danh mục"
        className="flex flex-wrap gap-x-4 gap-y-2 pb-6 text-xs md:hidden"
      >
        <Link href="/shop" className={category ? "" : "underline"}>
          Tất cả
        </Link>
        {categories.map((item) => (
          <Link
            key={item._id}
            href={`/shop?category=${item._id}`}
            className={item._id === category ? "underline" : ""}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {failed ? (
        <p role="alert" className="py-16 text-center">
          Không tải được sản phẩm. Vui lòng thử lại sau.
        </p>
      ) : results.length === 0 ? (
        <p className="py-16 text-center">Không tìm thấy sản phẩm nào.</p>
      ) : (
        <ProductGrid products={results} sortLinks={sortLinks} />
      )}

      {pages > 1 && (
        <nav
          aria-label="Phân trang"
          className="flex items-center justify-center gap-6 pt-16"
        >
          {current > 1 && (
            <Link
              href={buildHref({ current: current - 1 })}
              className="hover:underline"
            >
              Trang trước
            </Link>
          )}
          <span className="text-neutral-600">
            {current} / {pages}
          </span>
          {current < pages && (
            <Link
              href={buildHref({ current: current + 1 })}
              className="hover:underline"
            >
              Trang sau
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};

export default ShopPage;
