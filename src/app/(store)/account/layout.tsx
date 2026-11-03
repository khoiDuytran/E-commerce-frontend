import AccountNav from "@/components/store/account.nav";

const AccountLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    // Khu vực tài khoản hẹp hơn trang tổng thể và căn giữa, header/footer vẫn full width
    <div className="px-4 pt-4 pb-16 md:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default AccountLayout;
