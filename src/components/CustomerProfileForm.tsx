"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { updateCustomerProfile } from "@/app/customer/actions";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";

type UserProfile = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  profilePhoto: string | null;
};

export function CustomerProfileForm({ locale, user }: { locale: Locale; user: UserProfile }) {
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
      await updateCustomerProfile(fd);
      setSaved(true);
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm font-semibold text-emerald-700">{t(locale, "profileSaved")}</p>}

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
