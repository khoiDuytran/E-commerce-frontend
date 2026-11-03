"use client";
import { AdminContext } from "@/library/admin.context";
import {
  AppstoreOutlined,
  AppstoreAddOutlined,
  FileTextOutlined,
  PercentageOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout, Menu, MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";

type MenuItem = Required<MenuProps>["items"][number];

const AdminSideBar = () => {
  const { Sider } = Layout;
  const { collapseMenu } = useContext(AdminContext)!;
  const pathname = usePathname();

  // Xác định selectedKey dựa trên đường dẫn hiện tại
  const getSelectedKey = () => {
    if (pathname.includes("/dashboard/users")) return "users";
    if (pathname.includes("/dashboard/orders")) return "orders";
    if (pathname.includes("/dashboard/products")) return "products";
    if (pathname.includes("/dashboard/categories")) return "categories";
    if (pathname.includes("/dashboard/coupons")) return "coupons";
    return "dashboard";
  };

  const items: MenuItem[] = [
    {
      key: "grp",
      label: "Admin Panel",
      type: "group",
      children: [
        {
          key: "dashboard",
          label: <Link href={"/dashboard"}>Dashboard</Link>,
          icon: <AppstoreOutlined />,
        },
        {
          key: "orders",
          label: <Link href={"/dashboard/orders"}>Manage Orders</Link>,
          icon: <FileTextOutlined />,
        },
        {
          key: "products",
          label: <Link href={"/dashboard/products"}>Manage Products</Link>,
          icon: <ShoppingOutlined />,
        },
        {
          key: "users",
          label: <Link href={"/dashboard/users"}>Manage Users</Link>,
          icon: <TeamOutlined />,
        },
        {
          key: "categories",
          label: <Link href={"/dashboard/categories"}>Manage Categories</Link>,
          icon: <AppstoreAddOutlined />,
        },
        {
          key: "coupons",
          label: <Link href={"/dashboard/coupons"}>Manage Coupons</Link>,
          icon: <PercentageOutlined />,
        },
      ],
    },
  ];

  return (
    <Sider collapsed={collapseMenu}>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={items}
        style={{ height: "100vh" }}
      />
    </Sider>
  );
};

export default AdminSideBar;
