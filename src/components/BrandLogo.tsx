import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { BrandNameTagline } from "@/components/BrandNameTagline";

const LOGO_SRC = "/logo.png";

const imageSizes = {
  sm: { className: "h-16 w-16 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]", dim: 72 },
  md: { className: "h-24 w-24 rounded-2xl", dim: 96 },
  lg: { className: "h-28 w-28 rounded-2xl", dim: 112 },
  hero: {
    className: "h-32 w-32 rounded-2xl sm:h-36 sm:w-36 md:h-40 md:w-40",
    dim: 160,
  },
  mark: { className: "h-10 w-10 rounded-lg", dim: 40 },
} as const;

function BrandLogoImage({
  size,
  alt,
  className = "",
}: {
  size: keyof typeof imageSizes;
  alt: string;
  className?: string;
}) {
  const s = imageSizes[size];
  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={s.dim}
      height={s.dim}
      className={`object-cover shadow-xl shadow-brand-green/30 ${s.className} ${className}`}
      priority={size === "hero" || size === "mark"}
      unoptimized
    />
  );
}

export function BrandLogo({
  locale,
  size = "md",
  className = "",
  showTagline = true,
}: {
  locale: Locale;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showTagline?: boolean;
}) {
  const alt = t(locale, "appName");

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <BrandLogoImage size={size} alt={alt} />
      <div className="mt-4">
        {showTagline ? (
          <BrandNameTagline locale={locale} variant={size === "sm" ? "compact" : "hero"} />
        ) : (
          <BrandNameTagline locale={locale} variant="compact" />
        )}
      </div>
    </div>
  );
}

export function BrandLogoMark({ locale, className = "" }: { locale?: Locale; className?: string }) {
  const alt = locale ? t(locale, "appName") : "LK Studio";
  return <BrandLogoImage size="mark" alt={alt} className={`shrink-0 ${className}`} />;
}
