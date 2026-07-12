"use client";

import { useState } from "react";
import { MeasurementFieldsList } from "@/components/MeasurementFieldsList";
import { MEASUREMENT_TYPES, type MeasurementTypeId } from "@/lib/measurements";
import { MEASUREMENT_TYPE_THEMES } from "@/lib/measurement-field-guide";

const TYPE_TITLES: Record<MeasurementTypeId, string> = {
  blouse: "Blouse",
  dress: "Dress / Kurti",
};

export function MeasurementAppPreview() {
  const [type, setType] = useState<MeasurementTypeId>("blouse");
  const theme = MEASUREMENT_TYPE_THEMES[type];

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-1 text-lg font-bold text-zinc-900">App measurement list (live preview)</h2>
      <p className="mb-4 text-sm text-zinc-500">Same rows as the Measurements page — reference icons on the left.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {MEASUREMENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              type === t ? `${theme.accent} bg-zinc-100 ring-2 ring-zinc-300` : "bg-zinc-50 text-zinc-600"
            }`}
          >
            {TYPE_TITLES[t]}
          </button>
        ))}
      </div>

      <p className={`mb-3 text-sm font-bold ${theme.accent}`}>{TYPE_TITLES[type]}</p>
      <MeasurementFieldsList measurementType={type} locale="en" />
    </section>
  );
}
