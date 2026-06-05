"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
  addressName?: string;
  linkName?: string;
  latName?: string;
  lngName?: string;
  defaultAddress?: string;
  defaultLink?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
};

/** Address + maps link fields (manual entry). */
export function LiveLocationFields({
  locale,
  addressName = "address",
  linkName = "locationLink",
  latName = "latitude",
  lngName = "longitude",
  defaultAddress = "",
  defaultLink = "",
  defaultLat,
  defaultLng,
}: Props) {
  const [address, setAddress] = useState(defaultAddress);
  const [link, setLink] = useState(defaultLink);
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : "");

  return (
    <div className="space-y-3 rounded-xl border border-brand-green/10 bg-brand-cream/50 p-4">
      <p className="text-sm font-semibold text-brand-green">{t(locale, "myLocation")}</p>

      <textarea
        name={addressName}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={t(locale, "shopLocation")}
        rows={2}
        className="input-premium w-full"
      />
      <input
        name={linkName}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder={t(locale, "locationLink")}
        className="input-premium w-full"
      />
      <input type="hidden" name={latName} value={lat} />
      <input type="hidden" name={lngName} value={lng} />

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs font-semibold text-brand-green underline"
        >
          {t(locale, "openInMaps")} →
        </a>
      )}
    </div>
  );
}
