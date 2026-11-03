import { Skeleton } from "antd";

const ProductsLoading = () => (
  <div aria-label="Đang tải danh sách sản phẩm" className="p-4">
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

export default ProductsLoading;

