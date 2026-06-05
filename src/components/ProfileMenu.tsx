import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function ProfileMenu({
  locale,
  profileHref,
  profileLabel,
  profilePhoto,
}: {
  locale: Locale;
  profileHref: string;
  profileLabel?: string;
  profilePhoto?: string | null;
}) {
  const label = profileLabel ?? t(locale, "profile");

  return (
    <Link
      href={profileHref}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-gold bg-brand-gold shadow-md transition hover:bg-brand-gold-dark active:scale-[0.98] sm:h-12 sm:w-12"
      aria-label={label}
      title={t(locale, "profile")}
    >
      {profilePhoto ? (
        <Image src={profilePhoto} alt="" fill className="object-cover" unoptimized />
      ) : (
        <User className="h-5 w-5 text-brand-green sm:h-6 sm:w-6" />
      )}
    </Link>
  );
}
