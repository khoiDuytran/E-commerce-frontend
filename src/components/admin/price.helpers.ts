import type { FormRule } from "antd";

// Dùng chung cho form và bảng giá của sản phẩm, biến thể trong trang quản trị

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

// InputNumber: hiển thị dấu phẩy phân cách hàng nghìn; ô trống giữ trống
export const formatPriceInput = (value?: string | number) =>
  value === undefined || value === null || value === ""
    ? ""
    : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const parsePriceInput = (value?: string) =>
  value?.replace(/\$\s?|(,*)/g, "") as unknown as number;

/** Tỷ lệ lãi gộp trên giá bán (%), null khi chưa có giá nhập */
export const grossMarginPercent = (salePrice: number, costPrice?: number | null) =>
  costPrice == null || salePrice <= 0
    ? null
    : Math.round(((salePrice - costPrice) / salePrice) * 100);

/** Giá trước giảm không bắt buộc, nhưng có thì phải lớn hơn hoặc bằng giá bán (cùng quy tắc với backend) */
export const originalPriceRule =
  (salePriceField: string): FormRule =>
  ({ getFieldValue }) => ({
    validator(_, value?: number | null) {
      const salePrice = getFieldValue(salePriceField);
      if (value == null || salePrice == null || value >= salePrice) {
        return Promise.resolve();
      }
      return Promise.reject(
        new Error("Giá trước giảm phải lớn hơn hoặc bằng giá bán"),
      );
    },
  });
