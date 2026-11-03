"use client";
import AdminNotificationBell from "@/components/admin/admin.notification.bell";
import { AdminContext } from "@/library/admin.context";
import { disablePushBeforeSignOut } from "@/library/web.push";
import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Dropdown, Layout, Space } from "antd";
import { signOut } from "next-auth/react";
import { useContext } from "react";

const onSignOut = async () => {
  // Gỡ Web Push để máy dùng chung không nhận thông báo admin sau khi thoát
  await disablePushBeforeSignOut();
  await signOut();
};

const items: MenuProps["items"] = [
  {
    key: "1",
    label: <span>Settings</span>,
  },
  {
    key: "4",
    danger: true,
    label: <span onClick={() => void onSignOut()}>Đăng xuất</span>,
  },
];

const AdminHeader = ({ email }: { email?: string | null }) => {
  const { Header } = Layout;

  const { collapseMenu, setCollapseMenu } = useContext(AdminContext)!;

  return (
    <Header className="flex items-center justify-between p-0! bg-[#f5f5f5]!">
      <div className="flex items-center">
        <Button
          type="text"
          icon={collapseMenu ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapseMenu(!collapseMenu)}
          aria-label={collapseMenu ? "Mở rộng menu" : "Thu gọn menu"}
          className="text-base! w-16! h-16!"
        />
        {/* href để antd render thẻ <a>, không lồng <button> trong <a> */}
        <Button href="/" icon={<ShopOutlined />}>
          Về cửa hàng
        </Button>
      </div>

      <Space size="middle" className="mr-5">
        <AdminNotificationBell />
        <Dropdown menu={{ items }}>
          <a
            onClick={(e) => e.preventDefault()}
            className="leading-none text-inherit!"
          >
            <Space>
              Welcome {email ?? ""}
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AdminHeader;
