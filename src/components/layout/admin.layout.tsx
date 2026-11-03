import AdminContent from "@/components/layout/admin.content";
import AdminFooter from "@/components/layout/admin.footer";
import AdminHeader from "@/components/layout/admin.header";
import AdminSideBar from "@/components/layout/admin.sidebar";
import { AdminContextProvider } from "@/library/admin.context";
import { auth } from "@/auth";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();

  return (
    <AdminContextProvider>
      <div className="flex">
        {/* shrink-0 + min-w-0: nội dung rộng phải tự co lại, không được ép sidebar */}
        <div className="min-w-20 shrink-0">
          <AdminSideBar />
        </div>
        <div className="min-w-0 flex-1">
          {/* Chỉ truyền field cần hiển thị: props của client component nằm trong HTML gửi xuống trình duyệt */}
          <AdminHeader email={session?.user?.email} />
          <AdminContent>{children}</AdminContent>
          <AdminFooter />
        </div>
      </div>
    </AdminContextProvider>
  );
};

export default AdminLayout;
