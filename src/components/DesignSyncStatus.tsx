"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";
import type { SyncStatus } from "@/lib/catalog-sync/types";
import { Loader2 } from "lucide-react";

export function DesignSyncStatus({
  locale,
  status,
  newDesignCount,
  onDismissNew,
}: {
  locale: Locale;
  status: SyncStatus;
  newDesignCount: number;
  onDismissNew?: () => void;
}) {
  if (status === "updating") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500" role="status">
        <Loader2 className="h-3 w-3 animate-spin text-brand-green" />
        {t(locale, "updatingDesigns")}
      </p>
    );
  }

  if (status === "updated") {
    return (
      <p className="text-center text-xs text-brand-green" role="status">
        {t(locale, "designsUpdated")}
      </p>
    );
  }

  if (newDesignCount > 0) {
    return (
      <button
        type="button"
        onClick={onDismissNew}
        className="mx-auto block rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green"
      >
        {t(locale, "newDesignsBadge", { count: newDesignCount })}
      </button>
    );
  }

  return null;
}

export function PullToRefreshHint({
  pulling,
  refreshing,
  label,
}: {
  pulling: boolean;
  refreshing: boolean;
  label: string;
}) {
  if (!pulling && !refreshing) return null;
  return (
    <p className="py-1 text-center text-xs text-zinc-500" role="status">
      {label}
    </p>
  );
}
