"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CitySelect } from "@/components/CitySelect";
import { PhoneInput } from "@/components/PhoneInput";
import { acceptWorkerPartnerRequest } from "@/app/work-partner/actions";

export function WorkPartnerAcceptForm({
  locale,
  requestId,
  defaultCity,
  onCancel,
}: {
  locale: Locale;
  requestId: string;
  defaultCity?: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [years, setYears] = useState("");
  const [address, setAddress] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("requestId", requestId);
    fd.set("name", name.trim());
    fd.set("phone", phone.trim());
    fd.set("yearsExperience", years || "0");
    fd.set("address", address.trim());
    fd.set("locationLink", locationLink.trim());
    try {
      const result = await acceptWorkerPartnerRequest(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-brand-green/20 bg-brand-cream/60 p-3">
      <p className="text-sm font-bold text-brand-green">{t(locale, "workPartnerAcceptTitle")}</p>
      <p className="text-xs text-zinc-600">{t(locale, "workPartnerAcceptHint")}</p>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-brand-green">{t(locale, "name")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input-premium w-full"
          placeholder={t(locale, "workPartnerNamePlaceholder")}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-brand-green">{t(locale, "phone")}</span>
      <PhoneInput locale={locale} value={phone} onChange={setPhone} required />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-brand-green">{t(locale, "city")}</span>
        <CitySelect locale={locale} name="city" defaultValue={defaultCity ?? ""} required />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-brand-green">
          {t(locale, "workPartnerYearsExperience")}
        </span>
        <input
          type="number"
          min={0}
          max={60}
          value={years}
          onChange={(e) => setYears(e.target.value)}
          className="input-premium w-full"
          placeholder="0"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-zinc-600">
          {t(locale, "workPartnerAddressOptional")}
        </span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input-premium w-full"
          placeholder={t(locale, "workPartnerAddressPlaceholder")}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-zinc-600">
          {t(locale, "workPartnerLocationLinkOptional")}
        </span>
        <input
          value={locationLink}
          onChange={(e) => setLocationLink(e.target.value)}
          className="input-premium w-full"
          placeholder="https://maps.google.com/…"
          inputMode="url"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary px-4 py-2 text-sm">
          {pending ? t(locale, "workPartnerAccepting") : t(locale, "workPartnerAcceptConfirm")}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
          {t(locale, "cancel")}
        </button>
      </div>
    </form>
  );
}
