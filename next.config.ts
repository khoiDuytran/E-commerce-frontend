import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Ảnh sản phẩm tối đa 5MB, cộng thêm phần overhead của multipart
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
