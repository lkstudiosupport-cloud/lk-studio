"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";
import {
  loadAutoUpdateSettings,
  saveAutoUpdateSettings,
} from "@/lib/catalog-sync/idb";
import type { AutoUpdateDesignsSettings } from "@/lib/catalog-sync/types";

export function DesignCatalogAutoUpdateSetting({ locale }: { locale: Locale }) {
  const [settings, setSettings] = useState<AutoUpdateDesignsSettings>({
    wifi: true,
    mobileData: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadAutoUpdateSettings());
    setReady(true);
  }, []);

  function update(next: AutoUpdateDesignsSettings) {
    setSettings(next);
    saveAutoUpdateSettings(next);
  }

  if (!ready) return null;

  return (
    <section className="card-premium space-y-3 p-4">
      <h2 className="text-sm font-bold text-brand-green">{t(locale, "autoUpdateDesigns")}</h2>
      <p className="text-xs text-zinc-600">{t(locale, "autoUpdateDesignsHint")}</p>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t(locale, "autoUpdateOnWifi")}</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-green"
          checked={settings.wifi}
          onChange={(e) => update({ ...settings, wifi: e.target.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t(locale, "autoUpdateOnMobileData")}</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-green"
          checked={settings.mobileData}
          onChange={(e) => update({ ...settings, mobileData: e.target.checked })}
        />
      </label>
    </section>
  );
}
