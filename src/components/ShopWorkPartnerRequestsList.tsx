"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRequestStatus, WorkerPartnerRole } from "@prisma/client";
import { workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { formatWorkerPartnerSchedule } from "@/lib/work-partner-duration";
import { cancelWorkerPartnerRequest, rateAcceptedWorkPartner } from "@/app/shop/actions";
import { clearShopTabCache } from "@/lib/shop-tab-client-cache";
import type { ShopWorkerRequestListItem } from "@/lib/shop-tab-types";
import { whatsAppUrl } from "@/lib/whatsapp";

function statusClass(status: WorkerPartnerRequestStatus) {
  if (status === "OPEN") return "bg-amber-100 text-amber-900";
  if (status === "FILLED") return "bg-emerald-100 text-emerald-800";
  return "bg-zinc-100 text-zinc-600";
}

function statusKey(status: WorkerPartnerRequestStatus) {
  if (status === "OPEN") return "workerPartnerStatusOpen";
  if (status === "FILLED") return "workerPartnerStatusFilled";
  return "workerPartnerStatusCancelled";
}

export function ShopWorkPartnerRequestsList({
  locale,
  requests,
}: {
  locale: Locale;
  requests: ShopWorkerRequestListItem[];
}) {
  const router = useRouter();
  const [ratingPending, setRatingPending] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <div className="card-premium p-6 text-center text-sm text-zinc-600">
        {t(locale, "workerPartnerNoRequests")}
      </div>
    );
  }

  async function onCancel(id: string) {
    try {
      await cancelWorkerPartnerRequest(id);
      clearShopTabCache("workers");
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function onRate(requestId: string, rating: number) {
    setRatingPending(requestId);
    try {
      const fd = new FormData();
      fd.set("requestId", requestId);
      fd.set("rating", String(rating));
      await rateAcceptedWorkPartner(fd);
      clearShopTabCache("workers");
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setRatingPending(null);
    }
  }

  function roleLabel(role: WorkerPartnerRole, customRole: string | null) {
    if (role === "OTHER" && customRole) return customRole;
    return t(locale, workerPartnerRoleLabelKey(role));
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
        {t(locale, "workerPartnerMyRequests")}
      </h2>
      {requests.map((req) => {
        const partner = req.acceptedPartner;
        const wa = partner ? whatsAppUrl(partner.phone, t(locale, "workPartnerShopWhatsAppIntro")) : null;
        const tel = partner ? `tel:${partner.phone.replace(/\D/g, "")}` : null;

        return (
          <article key={req.id} className="card-premium space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-brand-green">{roleLabel(req.role, req.customRole)}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(req.status)}`}>
                {t(locale, statusKey(req.status))}
              </span>
            </div>
            {req.city && (
              <p className="text-xs text-zinc-500">
                {t(locale, "city")}: {req.city}
              </p>
            )}
            <p className="text-sm text-zinc-700">
              <span className="font-semibold text-brand-green">{t(locale, "workerPartnerSchedule")}: </span>
              {formatWorkerPartnerSchedule(req.neededFrom, req.durationType, req.customDays, locale)}
            </p>
            {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}
            <p className="text-xs text-zinc-400">{new Date(req.createdAt).toLocaleString()}</p>

            {partner && (
              <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                  {t(locale, "workPartnerAcceptedProfile")}
                </p>
                <p className="text-base font-bold text-brand-green">{partner.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-zinc-700">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {partner.phone}
                </p>
                {(partner.city || partner.address) && (
                  <p className="flex items-start gap-1.5 text-sm text-zinc-700">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {[partner.city, partner.address].filter(Boolean).join(" · ")}
                    </span>
                  </p>
                )}
                {partner.locationLink && (
                  <a
                    href={partner.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-semibold text-brand-green underline"
                  >
                    {t(locale, "workPartnerViewLocation")}
                  </a>
                )}
                <p className="text-sm text-zinc-700">
                  <span className="font-semibold">{t(locale, "workPartnerYearsExperience")}: </span>
                  {partner.yearsExperience} {t(locale, "workPartnerYearsUnit")}
                </p>
                <p className="flex items-center gap-1 text-sm text-zinc-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {partner.ratingAvg != null
                    ? `${partner.ratingAvg} (${partner.ratingCount})`
                    : t(locale, "workPartnerNoRatingsYet")}
                </p>

                <div className="pt-1">
                  <p className="mb-1 text-xs font-semibold text-emerald-900">
                    {req.shopRating != null
                      ? t(locale, "workPartnerYourRating")
                      : t(locale, "workPartnerRatePartner")}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={ratingPending === req.id}
                        onClick={() => void onRate(req.id, n)}
                        className="rounded p-1 hover:bg-white disabled:opacity-50"
                        aria-label={`${n}`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            (req.shopRating ?? 0) >= n
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {(wa || tel) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        {t(locale, "workPartnerContactPartnerWhatsApp")}
                      </a>
                    )}
                    {tel && (
                      <a href={tel} className="btn-secondary px-3 py-1.5 text-xs">
                        {t(locale, "workPartnerCallPartner")}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {req.status === "OPEN" && (
              <button
                type="button"
                onClick={() => void onCancel(req.id)}
                className="text-sm font-semibold text-red-700 underline"
              >
                {t(locale, "workerPartnerCancelRequest")}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
