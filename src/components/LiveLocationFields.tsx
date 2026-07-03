"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CitySelect } from "@/components/CitySelect";
import { SERVICE_CITIES } from "@/lib/cities";
import type { PickedLocation } from "@/components/MapLocationPicker";

const MapLocationPicker = dynamic(
  () => import("@/components/MapLocationPicker").then((m) => m.MapLocationPicker),
  { ssr: false }
);

type Props = {
  locale: Locale;
  cityName?: string;
  addressName?: string;
  linkName?: string;
  latName?: string;
  lngName?: string;
  defaultCity?: string;
  defaultAddress?: string;
  defaultLink?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  cityRequired?: boolean;
  hintKey?: "cityHint" | "customerCityHint" | "shopMapLocationHint";
  /** Shop: pick pin on map → address fills automatically. Customer: manual entry. */
  locationMode?: "manual" | "map";
};

export function LiveLocationFields({
  locale,
  cityName = "city",
  addressName = "address",
  linkName = "locationLink",
  latName = "latitude",
  lngName = "longitude",
  defaultCity = "",
  defaultAddress = "",
  defaultLink = "",
  defaultLat,
  defaultLng,
  cityRequired = true,
  hintKey = "cityHint",
  locationMode = "manual",
}: Props) {
  const [city, setCity] = useState(defaultCity);
  const [address, setAddress] = useState(defaultAddress);
  const [link, setLink] = useState(defaultLink);
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : "");
  const [mapOpen, setMapOpen] = useState(false);

  function applyPickedLocation(picked: PickedLocation) {
    setAddress(picked.address);
    setLink(picked.locationLink);
    setLat(String(picked.lat));
    setLng(String(picked.lng));
    if (picked.city) setCity(picked.city);
  }

  const hasMapLocation = Boolean(lat && lng && address);

  return (
    <div className="space-y-3 rounded-xl border border-brand-green/10 bg-brand-cream/50 p-4">
      <p className="text-sm font-semibold text-brand-green">{t(locale, "myLocation")}</p>
      <p className="text-xs text-zinc-600">{t(locale, hintKey)}</p>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-brand-green">{t(locale, "city")}</span>
        {locationMode === "map" ? (
          <select
            name={cityName}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required={cityRequired}
            className="input-premium w-full"
          >
            <option value="">{t(locale, "selectCity")}</option>
            {SERVICE_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <CitySelect
            key={defaultCity}
            locale={locale}
            name={cityName}
            defaultValue={defaultCity}
            required={cityRequired}
          />
        )}
      </label>

      {locationMode === "map" ? (
        <>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3"
          >
            <MapPin className="h-5 w-5" />
            {hasMapLocation ? t(locale, "changeLocationOnMap") : t(locale, "pickLocationOnMap")}
          </button>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-green">{t(locale, "shopLocation")}</span>
            <textarea
              name={addressName}
              value={address}
              readOnly
              placeholder={t(locale, "addressFromMapHint")}
              rows={3}
              className="input-premium w-full bg-white/80"
            />
            <p className="mt-1 text-xs text-zinc-500">{t(locale, "addressFromMapHint")}</p>
          </label>

          <input type="hidden" name={linkName} value={link} />
        </>
      ) : (
        <>
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
          <p className="text-xs text-zinc-500">{t(locale, "locationLinkHint")}</p>
        </>
      )}

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

      <MapLocationPicker
        locale={locale}
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={applyPickedLocation}
        initialLat={lat ? parseFloat(lat) : defaultLat}
        initialLng={lng ? parseFloat(lng) : defaultLng}
      />
    </div>
  );
}
