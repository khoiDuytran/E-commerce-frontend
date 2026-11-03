import AdminLayout from "@/components/layout/admin.layout";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => <AdminLayout>{children}</AdminLayout>;

export default DashboardLayout;
