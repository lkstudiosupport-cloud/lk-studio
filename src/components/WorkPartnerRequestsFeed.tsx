"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRequest, WorkerPartnerRole } from "@prisma/client";
import { WORKER_PARTNER_ROLES, workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { CitySelect } from "@/components/CitySelect";

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
          <select
            name="role"
            defaultValue={initialRole}
            className="input-premium w-full"
          >
            <option value="">{t(locale, "workerPartnerAnyRole")}</option>
            {WORKER_PARTNER_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(locale, workerPartnerRoleLabelKey(r))}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "city")}
          </span>
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
          {requests.map((req) => (
            <article key={req.id} className="card-premium space-y-2 p-4">
              <p className="font-bold text-brand-green">{roleLabel(req.role, req.customRole)}</p>
              <p className="text-sm font-semibold text-zinc-800">{req.shop.shopName}</p>
              <p className="text-xs text-zinc-500">
                {req.shop.shopCode}
                {req.city || req.shop.city ? ` · ${req.city ?? req.shop.city}` : ""}
              </p>
              {req.shop.address && <p className="text-sm text-zinc-600">{req.shop.address}</p>}
              {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}
              {(req.shop.phone || req.shop.whatsapp) && (
                <p className="text-sm text-brand-green">
                  {req.shop.phone ?? req.shop.whatsapp}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
