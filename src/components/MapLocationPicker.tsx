"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { DEFAULT_MAP_CENTER, googleMapsLink } from "@/lib/maps-link";
import { matchCityFromAddressText } from "@/lib/cities";

const MapLocationPickerInner = dynamic(
  () => import("@/components/MapLocationPickerInner").then((m) => m.MapLocationPickerInner),
  { ssr: false, loading: () => <div className="min-h-[280px] animate-pulse rounded-lg bg-zinc-200" /> }
);

export type PickedLocation = {
  lat: number;
  lng: number;
  address: string;
  locationLink: string;
  city: string | null;
};

type Props = {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialLat?: number | null;
  initialLng?: number | null;
};

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string | null }> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("Geocode failed");
  const data = (await res.json()) as { address?: string | null; city?: string | null };
  const address = data.address?.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const city = data.city ?? matchCityFromAddressText(address);
  return { address, city };
}

export function MapLocationPicker({
  locale,
  open,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}: Props) {
  const startLat = initialLat ?? DEFAULT_MAP_CENTER.lat;
  const startLng = initialLng ?? DEFAULT_MAP_CENTER.lng;

  const [lat, setLat] = useState(startLat);
  const [lng, setLng] = useState(startLng);
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLat(initialLat ?? DEFAULT_MAP_CENTER.lat);
    setLng(initialLng ?? DEFAULT_MAP_CENTER.lng);
    setError("");
  }, [open, initialLat, initialLng]);

  const handleMove = useCallback((nextLat: number, nextLng: number) => {
    setLat(nextLat);
    setLng(nextLng);
    setError("");
  }, []);

  async function useMyLocation() {
    setGeoBusy(true);
    setError("");
    try {
      if (!navigator.geolocation) throw new Error(t(locale, "locationError"));
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    } catch {
      setError(t(locale, "locationPermissionDenied"));
    }
    setGeoBusy(false);
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const { address, city } = await reverseGeocode(lat, lng);
      onConfirm({
        lat,
        lng,
        address,
        locationLink: googleMapsLink(lat, lng),
        city,
      });
      onClose();
    } catch {
      setError(t(locale, "locationPickFailed"));
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/50 p-3 sm:p-6">
      <div className="mx-auto flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center gap-2 text-brand-green">
            <MapPin className="h-5 w-5" />
            <p className="font-bold">{t(locale, "pickLocationOnMap")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-zinc-600">{t(locale, "pickLocationOnMapHint")}</p>

        <div className="min-h-0 flex-1 p-4">
          <MapLocationPickerInner lat={lat} lng={lng} onMove={handleMove} />
        </div>

        <div className="space-y-3 border-t border-zinc-200 p-4">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoBusy}
            className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Navigation className="h-4 w-4" />
            {geoBusy ? t(locale, "locationDetecting") : t(locale, "detectLocation")}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="button" onClick={confirm} disabled={busy} className="btn-primary w-full py-3">
            {busy ? "..." : t(locale, "saveLocation")}
          </button>
        </div>
      </div>
    </div>
  );
}
