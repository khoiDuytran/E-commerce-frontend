"use client";

import { useCart } from "@/library/cart.store";
import NotificationBell from "./notification.bell";
import {
  BagIcon,
  DashboardIcon,
  HeartIcon,
  IconBadge,
  SearchIcon,
  UserIcon,
} from "./store.icons";
import { STORE_NAME } from "@/utils/store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FocusEvent, FormEvent, useState } from "react";

interface IProps {
  categories: IStoreCategory[];
  serifClassName: string;
  // Lấy từ server để HTML đầu tiên đã đúng trạng thái đăng nhập; chỉ truyền role, không truyền session
  user: { role: string } | null;
}

const ICON_LINK =
  "flex cursor-pointer items-center transition-opacity hover:opacity-50";

// Cột danh mục con căn theo dòng danh mục cha đang chọn (đơn vị rem)
const MENU_ROW_HEIGHT = 2;
const MENU_ALL_PRODUCTS_HEIGHT = 3;

const StoreHeader = ({ categories, serifClassName, user }: IProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const isHome = pathname === "/";
  const isSolid = isHovered || isMenuOpen || isSearchOpen;

  const rootCategories = categories.filter((category) => !category.parentId);
  const activeIndex = rootCategories.findIndex(
    (category) => category._id === activeCategoryId,
  );
  const childCategories = categories.filter(
    (category) => activeCategoryId && category.parentId === activeCategoryId,
  );

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveCategoryId(null);
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = keyword.trim();
    setIsSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
  };

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        closeMenu();
      }}
      onBlur={onBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") closeMenu();
      }}
      className={`${isHome ? "absolute inset-x-0 top-0" : "sticky top-0"
        } z-30 ${
        // Dải tối giữ chữ trắng đọc được trên mọi màu ảnh nền
        isHome && !isSolid
          ? "bg-linear-to-b from-black/60 to-transparent text-white"
          : "bg-white text-black"
        }`}
    >
      {/* Điện thoại: cột icon co theo nội dung để các icon nằm trên một hàng */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-4 py-5 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <Link
          href="/"
          onMouseEnter={closeMenu}
          className={`col-span-2 text-center text-3xl tracking-tight uppercase md:order-2 md:col-span-1 ${serifClassName}`}
        >
          {STORE_NAME} DISCIPLINE
        </Link>

        <nav
          aria-label="Cửa hàng"
          className="flex flex-wrap items-center gap-x-6 gap-y-1 md:order-1"
        >
          <Link
            href="/shop"
            aria-expanded={isMenuOpen}
            onMouseEnter={() => setIsMenuOpen(true)}
            onFocus={() => setIsMenuOpen(true)}
            onClick={closeMenu}
            className="transition-opacity hover:opacity-50"
          >
            Cửa hàng
          </Link>
          <Link
            href="/stockists"
            onMouseEnter={closeMenu}
            onFocus={closeMenu}
            className="transition-opacity hover:opacity-50"
          >
            Tìm cửa hàng
          </Link>
        </nav>

        <div
          onMouseEnter={closeMenu}
          className="flex items-center justify-end gap-x-4 md:order-3 md:gap-x-5"
        >
          {isSearchOpen ? (
            <form onSubmit={onSearch} role="search">
              <input
                autoFocus
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onBlur={() => setIsSearchOpen(false)}
                placeholder="Tìm sản phẩm"
                aria-label="Tìm sản phẩm"
                className="w-36 border-b border-current bg-transparent outline-none placeholder:text-current"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Tìm kiếm"
              title="Tìm kiếm"
              className={ICON_LINK}
            >
              <SearchIcon />
            </button>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/dashboard"
              aria-label="Quản trị"
              title="Quản trị"
              className={ICON_LINK}
            >
              <DashboardIcon />
            </Link>
          )}
          {user && <NotificationBell />}
          {/* Chưa đăng nhập thì icon tài khoản dẫn tới trang đăng nhập */}
          <Link
            href={user ? "/account" : "/auth/login"}
            aria-label={user ? "Tài khoản" : "Đăng nhập"}
            title={user ? "Tài khoản" : "Đăng nhập"}
            className={ICON_LINK}
          >
            <UserIcon />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Yêu thích"
            title="Yêu thích"
            className={ICON_LINK}
          >
            <HeartIcon />
          </Link>
          <Link
            href="/cart"
            aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
            title="Giỏ hàng"
            className={`relative ${ICON_LINK}`}
          >
            <BagIcon />
            <IconBadge count={count} />
          </Link>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          aria-label="Danh mục sản phẩm"
          className="absolute inset-x-0 top-full hidden items-start bg-white px-10 pb-8 md:flex"
        >
          <ul className="w-52 shrink-0">
            <li style={{ height: `${MENU_ALL_PRODUCTS_HEIGHT}rem` }}>
              <Link
                href="/shop"
                onClick={closeMenu}
                onMouseEnter={() => setActiveCategoryId(null)}
                onFocus={() => setActiveCategoryId(null)}
                className="block transition-opacity hover:opacity-50"
              >
                Tất cả sản phẩm
              </Link>
            </li>
            {rootCategories.map((category) => (
              <li
                key={category._id}
                // Danh mục đang mở cao bằng cột danh mục con, đẩy các danh mục phía dưới xuống
                style={{
                  height: `${(category._id === activeCategoryId
                    ? Math.max(childCategories.length, 1)
                    : 1) * MENU_ROW_HEIGHT
                    }rem`,
                }}
                className="transition-[height] duration-200 ease-out motion-reduce:transition-none"
              >
                <Link
                  href={`/shop?category=${category._id}`}
                  onClick={closeMenu}
                  onMouseEnter={() => setActiveCategoryId(category._id)}
                  onFocus={() => setActiveCategoryId(category._id)}
                  className={`block ${category._id === activeCategoryId
                    ? "opacity-50 transition-opacity"
                    : "transition-opacity hover:opacity-50"
                    }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>

          {childCategories.length > 0 && (
            <ul
              style={{
                marginTop: `${MENU_ALL_PRODUCTS_HEIGHT + activeIndex * MENU_ROW_HEIGHT}rem`,
              }}
            >
              {childCategories.map((category) => (
                <li
                  key={category._id}
                  style={{ height: `${MENU_ROW_HEIGHT}rem` }}
                >
                  <Link
                    href={`/shop?category=${category._id}`}
                    onClick={closeMenu}
                    className="block transition-opacity hover:opacity-50"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </header>
  );
};

export default StoreHeader;
