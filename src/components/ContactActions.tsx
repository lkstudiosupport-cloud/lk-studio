import {
  Phone,
  MessageCircle,
  MapPin,
  Instagram,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import Image from "next/image";

type Shop = {
  shopName: string;
  address: string | null;
  locationLink: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  upiId: string | null;
  upiQrImage: string | null;
};

function cleanPhone(p: string) {
  return p.replace(/\s+/g, "").replace(/^\+/, "");
}

export function ContactActions({ shop, locale }: { shop: Shop; locale: Locale }) {
  const waLink = shop.whatsapp
    ? `https://wa.me/${cleanPhone(shop.whatsapp).replace(/\D/g, "")}`
    : null;
  const mapsLink = shop.locationLink
    ? shop.locationLink
    : shop.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`
      : null;
  const ig = shop.instagram;
  const igLink = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${ig.replace("@", "")}`
    : null;

  const items = [
    shop.phone && {
      icon: Phone,
      label: t(locale, "phone"),
      value: shop.phone,
      href: `tel:${shop.phone}`,
      color: "from-emerald-500 to-teal-600",
    },
    waLink && {
      icon: MessageCircle,
      label: t(locale, "whatsapp"),
      value: shop.whatsapp!,
      href: waLink,
      color: "from-green-500 to-green-600",
    },
    mapsLink && {
      icon: MapPin,
      label: t(locale, "address"),
      value: shop.address!,
      href: mapsLink,
      color: "from-orange-500 to-rose-500",
    },
    igLink && {
      icon: Instagram,
      label: t(locale, "instagram"),
      value: shop.instagram!,
      href: igLink,
      color: "from-pink-500 to-purple-600",
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    href: string;
    color: string;
  }[];

  return (
    <div className="space-y-6">
      <div className="card-premium overflow-hidden p-6 text-center">
        <h1 className="page-title text-3xl">{shop.shopName}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t(locale, "contactShop")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.label === t(locale, "whatsapp") || item.label === t(locale, "instagram") ? "_blank" : undefined}
            rel="noreferrer"
            className={`group flex items-start gap-3 rounded-2xl bg-gradient-to-br ${item.color} p-4 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <item.icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-white/90">
                {item.label}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </span>
              <span className="mt-0.5 block text-sm font-semibold leading-snug">{item.value}</span>
            </span>
          </a>
        ))}
      </div>

      {shop.upiId && (
        <div className="card-premium flex items-center gap-3 p-4">
          <CreditCard className="h-8 w-8 text-brand-green" />
          <div>
            <p className="text-xs font-semibold uppercase text-brand-green">{t(locale, "upiId")}</p>
            <p className="font-mono text-lg font-bold">{shop.upiId}</p>
          </div>
        </div>
      )}

      {shop.upiQrImage && (
        <div className="card-premium p-4 text-center">
          <p className="mb-3 font-semibold text-brand-green">{t(locale, "upiQr")}</p>
          <Image
            src={shop.upiQrImage}
            alt="UPI QR"
            width={220}
            height={220}
            className="mx-auto rounded-2xl border-4 border-brand-green/10 shadow-md"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
