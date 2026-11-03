import ProfileForm from "@/components/store/profile.form";
import { getMyProfile, requireToken } from "@/utils/account.api";

const AccountPage = async () => {
  const token = await requireToken("/account");
  const profile = await getMyProfile(token);

  return (
    <>
      <h1 className="border-b border-neutral-200 pb-4">Thông tin cá nhân</h1>
      <div className="pt-6">
        {profile ? (
          <ProfileForm
            profile={{
              _id: profile._id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              address: profile.address,
            }}
          />
        ) : (
          <p role="alert">Không tải được thông tin. Vui lòng thử lại sau.</p>
        )}
      </div>
    </>
  );
};

export default AccountPage;
