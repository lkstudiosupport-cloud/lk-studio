"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Phone, RefreshCw, Star, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRequestStatus, WorkerPartnerRole } from "@prisma/client";
import { workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { formatWorkerPartnerSchedule } from "@/lib/work-partner-duration";
import { cancelWorkerPartnerRequest, rateAcceptedWorkPartner } from "@/app/shop/actions";
import { clearShopTabCache } from "@/lib/shop-tab-client-cache";
import type { ShopWorkerRequestListItem } from "@/lib/shop-tab-types";
import { whatsAppUrl } from "@/lib/whatsapp";

type FilterTab = "all" | "open" | "accepted";

function statusClass(status: WorkerPartnerRequestStatus) {
  if (status === "OPEN") return "bg-amber-100 text-amber-900";
  if (status === "FILLED") return "bg-emerald-100 text-emerald-900";
  return "bg-zinc-100 text-zinc-600";
}

function statusLabel(locale: Locale, status: WorkerPartnerRequestStatus) {
  if (status === "OPEN") return t(locale, "workerPartnerStatusOpen");
  if (status === "FILLED") return t(locale, "workerPartnerStatusAccepted");
  return t(locale, "workerPartnerStatusCancelled");
}

export function ShopWorkPartnerRequestsList({
  locale,
  requests,
  onRefresh,
}: {
  locale: Locale;
  requests: ShopWorkerRequestListItem[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [ratingPending, setRatingPending] = useState<string | null>(null);

  const counts = useMemo(() => {
    let open = 0;
    let accepted = 0;
    for (const r of requests) {
      if (r.status === "OPEN") open += 1;
      if (r.status === "FILLED" && r.acceptedPartner) accepted += 1;
    }
    return { all: requests.length, open, accepted };
  }, [requests]);

  const visible = useMemo(() => {
    const filtered = requests.filter((r) => {
      if (filter === "open") return r.status === "OPEN";
      if (filter === "accepted") return r.status === "FILLED" && Boolean(r.acceptedPartner);
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aAcc = a.status === "FILLED" && a.acceptedPartner ? 0 : 1;
      const bAcc = b.status === "FILLED" && b.acceptedPartner ? 0 : 1;
      if (aAcc !== bAcc) return aAcc - bAcc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests, filter]);

  async function onCancel(id: string) {
    try {
      await cancelWorkerPartnerRequest(id);
      clearShopTabCache("workers");
      onRefresh?.();
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
      onRefresh?.();
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

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: t(locale, "workerPartnerFilterAll"), count: counts.all },
    { id: "open", label: t(locale, "workerPartnerFilterOpen"), count: counts.open },
    { id: "accepted", label: t(locale, "workerPartnerFilterAccepted"), count: counts.accepted },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-green/20 bg-brand-cream/70 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-brand-green">
          <UserRound className="h-4 w-4" />
          {t(locale, "workPartnerShopGuideTitle")}
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm text-zinc-700">
          <li>{t(locale, "workPartnerShopGuideStep1")}</li>
          <li>{t(locale, "workPartnerShopGuideStep2")}</li>
          <li>{t(locale, "workPartnerShopGuideStep3")}</li>
        </ol>
        {counts.accepted > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t(locale, "workPartnerAcceptedCount", { n: counts.accepted })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "workerPartnerMyRequests")}
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-green/20 px-2.5 py-1.5 text-xs font-semibold text-brand-green"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t(locale, "workPartnerRefreshRequests")}
          </button>
        )}
      </div>

      <div className="scroll-nav -mx-1 flex gap-2 px-1 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition sm:text-sm ${
              filter === tab.id
                ? "bg-brand-green text-brand-gold ring-brand-gold"
                : "bg-white text-brand-green ring-brand-green/20"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="card-premium p-6 text-center text-sm text-zinc-600">
          {t(locale, "workerPartnerNoRequests")}
        </div>
      ) : visible.length === 0 ? (
        <div className="card-premium p-6 text-center text-sm text-zinc-600">
          {filter === "accepted"
            ? t(locale, "workPartnerNoAcceptedYet")
            : t(locale, "workerPartnerNoRequests")}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => {
            const partner = req.acceptedPartner;
            const isAccepted = req.status === "FILLED" && partner;
            const wa = partner
              ? whatsAppUrl(partner.phone, t(locale, "workPartnerShopWhatsAppIntro"))
              : null;
            const tel = partner ? `tel:${partner.phone.replace(/\D/g, "")}` : null;

            return (
              <article
                key={req.id}
                className={`card-premium space-y-3 p-4 ${
                  isAccepted ? "ring-2 ring-emerald-400/60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-brand-green">
                    {roleLabel(req.role, req.customRole)}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(req.status)}`}
                  >
                    {statusLabel(locale, req.status)}
                  </span>
                </div>
                {req.city && (
                  <p className="text-xs text-zinc-500">
                    {t(locale, "city")}: {req.city}
                  </p>
                )}
                <p className="text-sm text-zinc-700">
                  <span className="font-semibold text-brand-green">
                    {t(locale, "workerPartnerSchedule")}:{" "}
                  </span>
                  {formatWorkerPartnerSchedule(
                    req.neededFrom,
                    req.durationType,
                    req.customDays,
                    locale
                  )}
                </p>
                {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}
                <p className="text-xs text-zinc-400">
                  {new Date(req.createdAt).toLocaleString()}
                </p>

                {isAccepted && partner && (
                  <div className="space-y-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      {t(locale, "workPartnerAcceptedProfile")}
                    </p>
                    <p className="text-lg font-bold text-brand-green">{partner.name}</p>
                    <div className="grid gap-2 text-sm text-zinc-800">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-brand-green" />
                        <span>
                          <span className="font-semibold">{t(locale, "phone")}: </span>
                          {partner.phone}
                        </span>
                      </p>
                      {(partner.city || partner.address) && (
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                          <span>
                            <span className="font-semibold">{t(locale, "workPartnerLocationLabel")}: </span>
                            {[partner.city, partner.address].filter(Boolean).join(" · ")}
                          </span>
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">
                          {t(locale, "workPartnerYearsExperience")}:{" "}
                        </span>
                        {partner.yearsExperience} {t(locale, "workPartnerYearsUnit")}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{t(locale, "workPartnerRatingLabel")}: </span>
                        {partner.ratingAvg != null
                          ? `${partner.ratingAvg} (${partner.ratingCount})`
                          : t(locale, "workPartnerNoRatingsYet")}
                      </p>
                    </div>

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

                    <div>
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
                              className={`h-6 w-6 ${
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
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            {t(locale, "workPartnerContactPartnerWhatsApp")}
                          </a>
                        )}
                        {tel && (
                          <a href={tel} className="btn-secondary px-4 py-2 text-sm">
                            {t(locale, "workPartnerCallPartner")}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {req.status === "FILLED" && !partner && (
                  <p className="text-sm text-zinc-600">{t(locale, "workPartnerFilledNoProfile")}</p>
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
      )}
    </div>
  );
}
