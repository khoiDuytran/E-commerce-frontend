"use client";

import { Layout } from "antd";

const AdminContent = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { Content } = Layout;

  return (
    <Content className="mt-6 ml-4 mr-4">
      <div className="p-6 min-h-96 bg-gray-100 rounded-lg">{children}</div>
    </Content>
  );
};

export default AdminContent;
