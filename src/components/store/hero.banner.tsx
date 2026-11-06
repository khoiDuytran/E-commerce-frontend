"use client";

import StoreImage from "@/components/store/store.image";
import { getVideoPosterUrl } from "@/utils/store";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Thời gian hiển thị mỗi banner ảnh; banner video chuyển khi phát hết
const IMAGE_DURATION_MS = 6000;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (callback: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

const isInternalLink = (link: string) => link.startsWith("/");

const BannerLink = ({
  banner,
  active,
  children,
}: {
  banner: IStoreBanner;
  active: boolean;
  children: React.ReactNode;
}) => {
  const className = "absolute inset-0 block";
  if (!banner.link) return <div className={className}>{children}</div>;

  // Banner đang ẩn không nhận focus bàn phím
  const common = {
    className,
    "aria-label": banner.title,
    tabIndex: active ? 0 : -1,
  };
  return isInternalLink(banner.link) ? (
    <Link href={banner.link} {...common}>
      {children}
    </Link>
  ) : (
    <a href={banner.link} rel="noopener noreferrer" {...common}>
      {children}
    </a>
  );
};

const HeroBanner = ({ banners }: { banners: IStoreBanner[] }) => {
  const [index, setIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const reducedMotion = usePrefersReducedMotion();
  const hasMany = banners.length > 1;
  const current = banners[index] ?? banners[0];

  const next = () => setIndex((value) => (value + 1) % banners.length);

  // Chỉ phát video của banner đang hiển thị, các video khác dừng và quay về đầu
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index && !reducedMotion) {
        video.currentTime = 0;
        // Trình duyệt có thể chặn tự phát; khi đó vẫn còn poster
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [index, reducedMotion]);

  // Banner ảnh tự chuyển sau một khoảng thời gian
  useEffect(() => {
    if (!hasMany || reducedMotion || current?.mediaType !== "image") return;
    const timer = setTimeout(
      () => setIndex((value) => (value + 1) % banners.length),
      IMAGE_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [index, hasMany, reducedMotion, current?.mediaType, banners.length]);

  return (
    <section
      className="relative h-dvh overflow-hidden bg-neutral-100"
      aria-roledescription="carousel"
      aria-label="Banner"
    >
      {banners.map((banner, i) => {
        const active = i === index;
        return (
          <div
            key={banner._id}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ${
              active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <BannerLink banner={banner} active={active}>
              {banner.mediaType === "video" ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={banner.mediaUrl}
                  poster={getVideoPosterUrl(banner.mediaUrl)}
                  muted
                  playsInline
                  // Chỉ một banner thì phát lặp, nhiều banner thì phát hết rồi chuyển
                  loop={!hasMany}
                  preload={i === 0 ? "auto" : "metadata"}
                  onEnded={hasMany ? next : undefined}
                  aria-label={banner.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <StoreImage
                  src={banner.mediaUrl}
                  alt={banner.title}
                  sizes="100vw"
                  cover
                />
              )}
            </BannerLink>
          </div>
        );
      })}

      {hasMany && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {banners.map((banner, i) => (
            <button
              key={banner._id}
              type="button"
              aria-label={`Xem banner ${i + 1}: ${banner.title}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full bg-white shadow transition-all ${
                i === index ? "w-8" : "w-4 opacity-50 hover:opacity-80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
