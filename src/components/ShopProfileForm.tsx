"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { updateShopProfile } from "@/app/shop/actions";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { UpiQrUpload } from "@/components/UpiQrUpload";
import { Phone, MessageCircle } from "lucide-react";
import { LiveLocationFields } from "@/components/LiveLocationFields";

type ShopProfileData = {
  shopName: string;
  city: string | null;
  address: string | null;
  locationLink: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  upiId: string | null;
  upiQrImage: string | null;
  profilePhoto: string | null;
};

export function ShopProfileForm({
  locale,
  profile,
}: {
  locale: Locale;
  profile: ShopProfileData;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateShopProfile(fd);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="card-premium space-y-4 p-4 sm:p-6">
      <ProfilePhotoUpload
        locale={locale}
        currentPhoto={profile.profilePhoto}
        name={profile.shopName}
      />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "shopName")}</span>
        <input name="shopName" defaultValue={profile.shopName} required className="input-premium w-full" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "phone")}</span>
        <div className="input-premium flex items-center gap-3 px-3 py-2.5">
          <Phone className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-brand-green shadow-none focus:outline-none focus:ring-0 sm:text-sm"
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "whatsapp")}</span>
        <div className="input-premium flex items-center gap-3 px-3 py-2.5">
          <MessageCircle className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
          <input
            name="whatsapp"
            type="tel"
            defaultValue={profile.whatsapp ?? ""}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-brand-green shadow-none focus:outline-none focus:ring-0 sm:text-sm"
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "instagram")}</span>
        <input
          name="instagram"
          defaultValue={profile.instagram ?? ""}
          placeholder="@yourshop"
          className="input-premium w-full"
        />
      </label>
      <LiveLocationFields
        key={`${profile.city ?? ""}-${profile.latitude ?? ""}-${profile.longitude ?? ""}`}
        locale={locale}
        addressName="address"
        defaultCity={profile.city ?? ""}
        defaultAddress={profile.address ?? ""}
        defaultLink={profile.locationLink ?? ""}
        defaultLat={profile.latitude}
        defaultLng={profile.longitude}
        locationMode="map"
        hintKey="shopMapLocationHint"
      />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "upiId")}</span>
        <input name="upiId" defaultValue={profile.upiId ?? ""} className="input-premium w-full" />
      </label>
      <UpiQrUpload locale={locale} currentImage={profile.upiQrImage} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm font-semibold text-emerald-700">{t(locale, "profileSaved")}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "..." : t(locale, "save")}
      </button>
    </form>
  );
}
