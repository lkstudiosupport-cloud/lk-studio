"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocaleLocationBar } from "./LocaleLocationBar";
import { ProfileMenu } from "./ProfileMenu";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { BrandLogoMark } from "./BrandLogo";
import { BrandNameTagline } from "./BrandNameTagline";

type LinkItem = { href: string; label: string; shortLabel?: string };

function isNavActive(href: string, pathname: string) {
  if (href === "/shop" || href === "/customer") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavPill({
  href,
  label,
  shortLabel,
  active,
  onNavigate,
  compact,
}: {
  href: string;
  label: string;
  shortLabel?: string;
  active: boolean;
  onNavigate: (href: string) => void;
  compact?: boolean;
}) {
  const displayLabel = compact ? (shortLabel ?? label) : label;

  return (
    <button
      type="button"
      onClick={() => {
        if (!active) onNavigate(href);
      }}
      aria-current={active ? "page" : undefined}
      aria-label={compact && shortLabel ? label : undefined}
      title={compact && shortLabel ? label : undefined}
      className={
        compact
          ? active
            ? "brand-bottom-nav-item brand-bottom-nav-item-active"
            : "brand-bottom-nav-item"
          : active
            ? "brand-nav-pill brand-nav-pill-active"
            : "brand-nav-pill"
      }
    >
      {compact ? <span className="brand-bottom-nav-label">{displayLabel}</span> : displayLabel}
    </button>
  );
}

export function NavShell({
  locale,
  title,
  links,
  profileHref,
  profileLabel,
  profilePhoto,
  hideNavOnPaths,
  navPosition = "top",
}: {
  locale: Locale;
  title: string;
  links: LinkItem[];
  profileHref: string;
  profileLabel?: string;
  profilePhoto?: string | null;
  /** Hide the tab nav on exact paths (e.g. shop dashboard home). */
  hideNavOnPaths?: string[];
  navPosition?: "top" | "bottom";
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const hideNav = hideNavOnPaths?.includes(pathname) ?? false;

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    for (const link of links) router.prefetch(link.href);
    router.prefetch(profileHref);
  }, [links, profileHref, router]);

  function navigate(href: string) {
    setPendingHref(href);
    startTransition(() => router.push(href));
  }

  const navItems = links.map((l) => {
    const active = isNavActive(l.href, pathname) || pendingHref === l.href;
    return (
      <NavPill
        key={l.href}
        href={l.href}
        label={l.label}
        shortLabel={l.shortLabel}
        active={active}
        onNavigate={navigate}
        compact={navPosition === "bottom"}
      />
    );
  });

  return (
    <>
      <header className="brand-header sticky top-0 z-20">
        <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3.5 md:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
            <BrandLogoMark locale={locale} />
            <div className="min-w-0 flex-1">
              <BrandNameTagline locale={locale} variant="header" />
              {title.trim() && title !== t(locale, "appName") && (
                <p className="mt-0.5 truncate text-xs font-medium text-white/70 sm:text-sm">{title}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <LocaleLocationBar locale={locale} />
            <ProfileMenu
              locale={locale}
              profileHref={profileHref}
              profileLabel={profileLabel ?? t(locale, "profile")}
              profilePhoto={profilePhoto}
            />
          </div>
        </div>
        {!hideNav && navPosition === "top" && (
          <nav className="scroll-nav mx-auto flex w-full min-w-0 max-w-5xl gap-1.5 overflow-x-auto px-2 pb-3 pt-0.5 sm:gap-2 sm:px-3 sm:pb-3.5 md:gap-2.5 md:pb-4">
            {navItems}
          </nav>
        )}
      </header>

      {!hideNav && navPosition === "bottom" && (
        <nav className="brand-bottom-nav fixed inset-x-0 bottom-0 z-30" aria-label={t(locale, "appName")}>
          <div className="mx-auto flex w-full min-w-0 max-w-5xl items-stretch justify-around gap-0 px-0.5 pt-0.5 sm:gap-0.5 sm:px-2 sm:pt-1">
            {navItems}
          </div>
        </nav>
      )}
    </>
  );
}
