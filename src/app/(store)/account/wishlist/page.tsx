import WishlistView from "@/components/store/wishlist.view";
import { getMyWishlist, requireToken } from "@/utils/account.api";

const WishlistPage = async () => {
  const token = await requireToken("/account/wishlist");
  const items = await getMyWishlist(token);

  return (
    <>
      <h1 className="border-b border-neutral-200 pb-4">Yêu thích</h1>
      {items === null ? (
        <p role="alert" className="py-16 text-center">
          Không tải được danh sách yêu thích. Vui lòng thử lại sau.
        </p>
      ) : (
        <WishlistView items={items} />
      )}
    </>
  );
};

export default WishlistPage;
