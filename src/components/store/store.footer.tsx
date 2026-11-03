"use client";

import { STORE_NAME } from "@/utils/store";
import { usePathname } from "next/navigation";

// Chỉ hiện liên kết mạng xã hội đã được cấu hình, tránh link chết
const SOCIAL_LINKS = [
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
];

const StoreFooter = () => {
  const isHome = usePathname() === "/";

  return (
    <footer
      className={`flex items-center justify-between gap-6 px-4 py-5 md:px-10 ${
        isHome
          ? "absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/60 to-transparent text-white"
          : "mt-auto"
      }`}
    >
      <span>
        © {new Date().getFullYear()} {STORE_NAME}
      </span>
      <div className="flex gap-6">
        {SOCIAL_LINKS.filter((link) => link.href).map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
};

export default StoreFooter;
