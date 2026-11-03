import { auth } from "@/auth";
import StoreFooter from "@/components/store/store.footer";
import StoreHeader from "@/components/store/store.header";
import { getStoreCategories } from "@/utils/store.api";
import { STORE_NAME } from "@/utils/store";
import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: "500",
});

export const metadata: Metadata = {
  title: STORE_NAME,
  description: `Cửa hàng trực tuyến ${STORE_NAME}`,
};

const StoreLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [categories, session] = await Promise.all([
    getStoreCategories(),
    auth(),
  ]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-white text-[13px] text-black">
      <StoreHeader
        categories={categories}
        serifClassName={serif.className}
        user={session?.user ? { role: session.user.role } : null}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
};

export default StoreLayout;
