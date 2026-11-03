import ProductDetail from "@/components/store/product.detail";
import { getStoreProductBySlug, getStoreVariants } from "@/utils/store.api";
import { notFound } from "next/navigation";

interface IProps {
  params: Promise<{ slug: string }>;
}

const ProductPage = async ({ params }: IProps) => {
  const { slug } = await params;

  // Slug đi vào filter của aqp nên chỉ nhận đúng định dạng
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();

  const product = await getStoreProductBySlug(slug);
  if (!product) notFound();

  const variants = await getStoreVariants(product._id);

  return (
    <div className="pt-4">
      <ProductDetail product={product} variants={variants} />
    </div>
  );
};

export default ProductPage;
