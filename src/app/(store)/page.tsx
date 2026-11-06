import HeroBanner from "@/components/store/hero.banner";
import StoreImage from "@/components/store/store.image";
import { STORE_HERO_IMAGE } from "@/utils/store";
import { getStoreBanners, getStoreProducts } from "@/utils/store.api";
import Link from "next/link";

const HomePage = async () => {
  // Banner do admin quản lý trong /dashboard/banners
  const banners = await getStoreBanners();
  if (banners.length > 0) return <HeroBanner banners={banners} />;

  // Chưa có banner nào đang bật: giữ ảnh nền mặc định như trước
  const { results } = await getStoreProducts({
    sort: "-createdAt",
    pageSize: 1,
    images: "/./",
  });
  const featured = results[0];

  return (
    <section className="relative h-dvh overflow-hidden bg-neutral-100">
      {featured ? (
        <Link
          href={`/shop`}
          aria-label={`Xem sản phẩm`}
          className="absolute inset-0 block"
        >
          <StoreImage
            src={STORE_HERO_IMAGE}
            alt={featured.name}
            sizes="100vw"
            cover
          />
        </Link>
      ) : (
        // Chưa có ảnh sản phẩm: dùng bố cục chéo hai mảng đen trắng
        <div
          aria-hidden
          className="absolute inset-0 bg-black [clip-path:polygon(0_0,62%_0,18%_100%,0_100%)]"
        />
      )}
    </section>
  );
};

export default HomePage;
