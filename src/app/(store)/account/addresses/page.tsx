import AddressBook from "@/components/store/address.book";
import { getMyAddresses, requireToken } from "@/utils/account.api";

const AddressesPage = async () => {
  const token = await requireToken("/account/addresses");
  const addresses = await getMyAddresses(token);

  return (
    <>
      <h1 className="border-b border-neutral-200 pb-4">Địa chỉ</h1>
      <div className="max-w-2xl pt-6">
        {addresses ? (
          <AddressBook addresses={addresses} />
        ) : (
          <p role="alert">Không tải được địa chỉ. Vui lòng thử lại sau.</p>
        )}
      </div>
    </>
  );
};

export default AddressesPage;
