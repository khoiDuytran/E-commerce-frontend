"use client";
import { AdminContext } from "@/library/admin.context";
import {
  AppstoreOutlined,
  AppstoreAddOutlined,
  FileTextOutlined,
  PictureOutlined,
  PercentageOutlined,
  RollbackOutlined,
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
    if (pathname.includes("/dashboard/refunds")) return "refunds";
    if (pathname.includes("/dashboard/products")) return "products";
    if (pathname.includes("/dashboard/categories")) return "categories";
    if (pathname.includes("/dashboard/coupons")) return "coupons";
    if (pathname.includes("/dashboard/banners")) return "banners";
    return "dashboard";
  };

  const items: MenuItem[] = [
    {
      key: "grp",
      type: "group",
      children: [
        {
          key: "dashboard",
          label: <Link href={"/dashboard"}>Tổng quan</Link>,
          icon: <AppstoreOutlined />,
        },
        {
          key: "orders",
          label: <Link href={"/dashboard/orders"}>Đơn hàng</Link>,
          icon: <FileTextOutlined />,
        },
        {
          key: "refunds",
          label: <Link href={"/dashboard/refunds"}>Hoàn hàng</Link>,
          icon: <RollbackOutlined />,
        },
        {
          key: "products",
          label: <Link href={"/dashboard/products"}>Sản phẩm</Link>,
          icon: <ShoppingOutlined />,
        },
        {
          key: "users",
          label: <Link href={"/dashboard/users"}>Người dùng</Link>,
          icon: <TeamOutlined />,
        },
        {
          key: "categories",
          label: <Link href={"/dashboard/categories"}>Danh mục</Link>,
          icon: <AppstoreAddOutlined />,
        },
        {
          key: "coupons",
          label: <Link href={"/dashboard/coupons"}>Mã giảm giá</Link>,
          icon: <PercentageOutlined />,
        },
        {
          key: "banners",
          label: <Link href={"/dashboard/banners"}>Banner trang chủ</Link>,
          icon: <PictureOutlined />,
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
