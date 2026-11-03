import { Skeleton } from "antd";

const CategoriesLoading = () => (
  <div aria-label="Đang tải danh sách danh mục">
    <Skeleton active />
  </div>
);

export default CategoriesLoading;
