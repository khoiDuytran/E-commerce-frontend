import StockistGallery from "@/components/store/stockist.gallery";
import { STORE_NAME } from "@/utils/store";
import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: `Tìm cửa hàng | ${STORE_NAME}`,
//   description: `Hình ảnh cửa hàng thực tế của ${STORE_NAME}`,
// };

// Thứ tự trong danh sách là thứ tự hiển thị; thêm ảnh mới vào public/stockist rồi khai báo ở đây
const STOCKIST_IMAGES = [
  "flagship-store_0a494b63e06e4a15a26fba7157d5b2bd_master.jpg",
  "flagship-store2_0638a22b5b5145ccb640ceb46fbce029_master.jpg",
  "flagship-store3_51ca54d0e5304656a2865e62445e2240_master.webp",
  "flagship-store4_3ede6bb091044569a1acfbb1c70d4332_master.webp",
];

const StockistsPage = () => {
  const images = STOCKIST_IMAGES.map((image, index) => ({
    src: `/stockist/${image}`,
    alt: `Không gian cửa hàng ${STORE_NAME}, ảnh ${index + 1}`,
  }));

  return (
    <div className="pt-4 pb-2">
      <h1 className="sr-only">Stockists</h1>
      <StockistGallery images={images} />
      <section className="px-2 py-12 text-center">
        <h2 className="pb-3 border-t border-neutral-200 pt-4">STYLISHU FLAGSHIP STORE</h2>
        <address className="space-y-2 text-neutral-700 not-italic">
          <p>144/05 &amp; 275/05 Quan Nhan, Nhan Chinh,</p>
          <p>Thanh Xuan, Ha Noi City</p>
          <p>Mon - Sun: 10:00 - 21:00</p>
        </address>
      </section>
    </div>
  );
};

export default StockistsPage;
