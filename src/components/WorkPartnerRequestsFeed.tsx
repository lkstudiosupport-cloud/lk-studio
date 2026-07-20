"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRequest, WorkerPartnerRole } from "@prisma/client";
import { WORKER_PARTNER_ROLES, workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { formatWorkerPartnerSchedule } from "@/lib/work-partner-duration";
import { CitySelect } from "@/components/CitySelect";
import { whatsAppUrl } from "@/lib/whatsapp";
import { WorkPartnerAcceptForm } from "@/components/WorkPartnerAcceptForm";

type ShopInfo = {
  shopName: string;
  shopCode: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
};

type Row = WorkerPartnerRequest & { shop: ShopInfo };

export function WorkPartnerRequestsFeed({
  locale,
  requests,
  initialRole,
  initialCity,
}: {
  locale: Locale;
  requests: Row[];
  initialRole: string;
  initialCity: string;
}) {
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 20_000);
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  function applyFilters(role: string, city: string) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (city) params.set("city", city);
    const q = params.toString();
    router.push(q ? `/work-partner/requests?${q}` : "/work-partner/requests");
  }

  function roleLabel(role: WorkerPartnerRole, customRole: string | null) {
    if (role === "OTHER" && customRole) return customRole;
    return t(locale, workerPartnerRoleLabelKey(role));
  }

  return (
    <div className="space-y-4">
      <form
        className="card-premium grid gap-3 p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          applyFilters(String(fd.get("role") ?? ""), String(fd.get("city") ?? ""));
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "workerPartnerRoleLabel")}
          </span>
          <select name="role" defaultValue={initialRole} className="input-premium w-full">
            <option value="">{t(locale, "workerPartnerAnyRole")}</option>
            {WORKER_PARTNER_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(locale, workerPartnerRoleLabelKey(r))}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "city")}</span>
          <CitySelect locale={locale} name="city" defaultValue={initialCity} />
        </label>
        <button type="submit" className="btn-primary sm:col-span-2">
          {t(locale, "workerPartnerFilter")}
        </button>
      </form>

      {requests.length === 0 ? (
        <div className="card-premium p-6 text-center text-sm text-zinc-600">
          {t(locale, "workPartnerNoOpenRequests")}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const contact = req.shop.whatsapp || req.shop.phone;
            const cityLabel = req.city ?? req.shop.city;
            const wa = contact
              ? whatsAppUrl(
                  contact,
                  `${t(locale, "workPartnerWhatsAppIntro")} ${req.shop.shopName} — ${roleLabel(req.role, req.customRole)}`
                )
              : null;
            const tel = contact ? `tel:${contact.replace(/\D/g, "")}` : null;
            const isAccepting = acceptingId === req.id;

            return (
              <article key={req.id} className="card-premium space-y-2 p-4">
                <p className="font-bold text-brand-green">{roleLabel(req.role, req.customRole)}</p>
                <p className="text-sm font-semibold text-zinc-800">{req.shop.shopName}</p>
                <p className="text-xs text-zinc-500">
                  {req.shop.shopCode}
                  {cityLabel ? ` · ${cityLabel}` : ""}
                </p>
                {req.shop.address && <p className="text-sm text-zinc-600">{req.shop.address}</p>}
                <p className="text-sm font-medium text-zinc-700">
                  {t(locale, "workerPartnerSchedule")}:{" "}
                  {formatWorkerPartnerSchedule(req.neededFrom, req.durationType, req.customDays, locale)}
                </p>
                {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}

                {isAccepting ? (
                  <WorkPartnerAcceptForm
                    locale={locale}
                    requestId={req.id}
                    defaultCity={cityLabel ?? ""}
                    onCancel={() => setAcceptingId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAcceptingId(req.id)}
                      className="btn-primary px-3 py-2 text-sm"
                    >
                      {t(locale, "workPartnerAccept")}
                    </button>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary px-3 py-2 text-sm"
                      >
                        {t(locale, "workPartnerContactWhatsApp")}
                      </a>
                    )}
                    {tel && (
                      <a href={tel} className="btn-secondary px-3 py-2 text-sm">
                        {t(locale, "workPartnerCallShop")}
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
