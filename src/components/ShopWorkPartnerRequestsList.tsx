"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { WorkerPartnerRequest, WorkerPartnerRequestStatus, WorkerPartnerRole } from "@prisma/client";
import { workerPartnerRoleLabelKey } from "@/lib/work-partner-roles";
import { cancelWorkerPartnerRequest } from "@/app/shop/actions";

type Row = Pick<
  WorkerPartnerRequest,
  "id" | "role" | "customRole" | "notes" | "city" | "status" | "createdAt"
>;

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
  requests: Row[];
}) {
  const router = useRouter();

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
      router.refresh();
    } catch {
      /* ignore */
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
      {requests.map((req) => (
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
          {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}
          <p className="text-xs text-zinc-400">
            {new Date(req.createdAt).toLocaleString()}
          </p>
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
      ))}
    </div>
  );
}
