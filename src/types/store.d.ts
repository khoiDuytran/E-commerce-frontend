export {};

declare global {
  interface IStoreCategory {
    _id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  }

  interface IStoreProduct {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    sizeGuide?: string;
    detailsFit?: string;
    images: string[];
    // Giá bán
    basePrice: number;
    // Giá trước giảm, lớn hơn giá bán thì hiện gạch ngang
    originalPrice?: number;
    stock: number;
  }

  // Sản phẩm trong danh sách yêu thích: có thể đã ngừng bán sau khi được thêm
  interface IStoreWishlistItem extends IStoreProduct {
    isActive: boolean;
  }

  interface IStoreVariant {
    _id: string;
    name: string;
    attributes: Record<string, string>;
    // Giá bán
    price: number;
    originalPrice?: number;
    stock: number;
    images: string[];
  }

  interface ICartItem {
    productId: string;
    variantId?: string;
    slug: string;
    name: string;
    variantName?: string;
    image?: string;
    price: number;
    quantity: number;
    maxQuantity: number;
  }

  interface IStoreCoupon {
    _id: string;
    code: string;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
    minOrderValue?: number;
    maxDiscount?: number;
  }

  interface IShippingAddress {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detail: string;
  }

  interface IStoreAddress extends IShippingAddress {
    _id: string;
    isDefault?: boolean;
  }

  interface IStoreProfile {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    address?: string;
  }

  interface IStoreOrderItem {
    productName: string;
    variantName?: string;
    image?: string;
    price: number;
    quantity: number;
  }

  interface IStoreOrder {
    _id: string;
    orderCode: string;
    items: IStoreOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    status: string;
    paymentStatus: string;
    note?: string;
    createdAt: string;
  }

  interface IStoreRefund {
    orderCode: string;
    status: string;
    reason: string;
    description?: string;
    adminNote?: string;
    refundAmount: number;
    createdAt: string;
  }
}
