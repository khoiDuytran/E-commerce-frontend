import { ReactNode } from "react";

// Icon nét dùng chung cho header và các nút của cửa hàng, cùng cỡ và độ đậm nét
const STROKE_WIDTH = 1.8;

const Icon = ({
  children,
  size = 22,
  filled = false,
}: {
  children: ReactNode;
  size?: number;
  filled?: boolean;
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={STROKE_WIDTH}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const BellIcon = () => (
  <Icon>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);

export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const HeartIcon = ({
  filled = false,
  size,
}: {
  filled?: boolean;
  size?: number;
}) => (
  <Icon filled={filled} size={size}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
  </Icon>
);

export const BagIcon = () => (
  <Icon>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Icon>
);

export const DashboardIcon = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icon>
);

/** Số đếm ở góc trên bên phải của icon: chữ trắng nền đen */
export const IconBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span
      aria-hidden="true"
      className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-black px-1 text-center text-[10px] leading-4 font-medium text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  ) : null;
