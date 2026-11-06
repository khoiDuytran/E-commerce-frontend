import { Skeleton } from "antd";

const BannersLoading = () => (
  <div aria-label="Đang tải danh sách banner">
    <Skeleton active />
  </div>
);

export default BannersLoading;
