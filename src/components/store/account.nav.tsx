"use client";

import { disablePushBeforeSignOut } from "@/library/web.push";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/account", label: "Thông tin cá nhân" },
  { href: "/account/addresses", label: "Địa chỉ" },
  { href: "/account/orders", label: "Đơn hàng" },
  { href: "/account/wishlist", label: "Yêu thích" },
];

const DISABLE_HREF = "/account/disable";

const AccountNav = ({ isAdmin }: { isAdmin: boolean }) => {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const onSignOut = async () => {
    setIsSigningOut(true);
    // Gỡ Web Push để máy dùng chung không nhận thông báo của tài khoản vừa thoát
    await disablePushBeforeSignOut();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav
      aria-label="Tài khoản"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 md:flex-col md:items-start"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={
            pathname === link.href
              ? "underline"
              : "transition-opacity hover:opacity-50"
          }
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => void onSignOut()}
        disabled={isSigningOut}
        className="cursor-pointer text-red-600 hover:underline disabled:cursor-wait disabled:opacity-50 md:mt-6"
      >
        {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
      {/* Backend chặn admin tự khóa nên không hiển thị cho admin */}
      {!isAdmin && (
        <Link
          href={DISABLE_HREF}
          aria-current={pathname === DISABLE_HREF ? "page" : undefined}
          className={`text-sm text-neutral-500 hover:text-red-600 ${
            pathname === DISABLE_HREF ? "underline" : "hover:underline"
          }`}
        >
          Vô hiệu hóa tài khoản
        </Link>
      )}
    </nav>
  );
};

export default AccountNav;
