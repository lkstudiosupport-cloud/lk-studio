"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { updateCustomerProfile } from "@/app/customer/actions";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { LiveLocationFields } from "@/components/LiveLocationFields";

type UserProfile = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  profilePhoto: string | null;
  city: string | null;
  address: string | null;
  locationLink: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function CustomerProfileForm({ locale, user }: { locale: Locale; user: UserProfile }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedCity, setSavedCity] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSavedCity(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const city = String(fd.get("city") ?? "").trim();
    try {
      await updateCustomerProfile(fd);
      setSaved(true);
      setSavedCity(city || null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="card-premium space-y-4 p-4 sm:p-6">
      <ProfilePhotoUpload locale={locale} currentPhoto={user.profilePhoto} name={user.name} />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "name")}</span>
        <input name="name" defaultValue={user.name} required className="input-premium w-full" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "phone")}</span>
        <input
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          placeholder="+91 ..."
          className="input-premium w-full"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "whatsapp")}</span>
        <input
          name="whatsapp"
          type="tel"
          defaultValue={user.whatsapp ?? ""}
          placeholder="+91 ..."
          className="input-premium w-full"
        />
      </label>

      <LiveLocationFields
        key={`${user.city ?? ""}-${user.address ?? ""}`}
        locale={locale}
        defaultCity={user.city ?? ""}
        defaultAddress={user.address ?? ""}
        defaultLink={user.locationLink ?? ""}
        defaultLat={user.latitude}
        defaultLng={user.longitude}
        cityRequired
        hintKey="customerCityHint"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">{t(locale, "profileSaved")}</p>
          {savedCity && (
            <>
              <p>{t(locale, "citySavedHint", { city: savedCity })}</p>
              <Link href="/customer/shops" className="inline-block font-semibold text-brand-green underline">
                {t(locale, "viewShopsInCity", { city: savedCity })} →
              </Link>
            </>
          )}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "..." : t(locale, "save")}
      </button>
    </form>
  );
}

export function CustomerProfileHeader({ locale }: { locale: Locale }) {
  return (
    <h1 className="page-title flex items-center gap-2">
      <User className="h-8 w-8 text-brand-green" />
      {t(locale, "customerProfileTitle")}
    </h1>
  );
}
