import { auth } from "@/auth";
import DisableAccountForm from "@/components/store/disable.account.form";
import { requireToken } from "@/utils/account.api";

const DisableAccountPage = async () => {
  await requireToken("/account/disable");
  const session = await auth();

  return (
    <>
      <h1 className="border-b border-neutral-200 pb-4">
        Vô hiệu hóa tài khoản
      </h1>
      <div className="pt-6">
        {session?.user?.role === "ADMIN" ? (
          <p role="alert">Tài khoản quản trị viên không thể tự vô hiệu hóa.</p>
        ) : (
          <DisableAccountForm />
        )}
      </div>
    </>
  );
};

export default DisableAccountPage;
