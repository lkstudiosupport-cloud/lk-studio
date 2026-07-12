import {
  fieldsForType,
  MEASUREMENT_TYPES,
  type MeasurementFieldKey,
  type MeasurementTypeId,
} from "@/lib/measurements";
import { measurementIconPath } from "@/lib/measurement-icon-paths";
import { MEASUREMENT_TYPE_THEMES, isCircumferenceField } from "@/lib/measurement-field-guide";
import { t } from "@/lib/i18n";
import { MeasurementAppPreview } from "./MeasurementAppPreview";

export const metadata = {
  title: "Measurement icons preview",
};

const TYPE_TITLES: Record<MeasurementTypeId, string> = {
  blouse: "Blouse",
  dress: "Dress / Kurti",
};

function fieldTitle(type: MeasurementTypeId, key: MeasurementFieldKey): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t("en", typedKey);
  const base = typed !== typedKey ? typed : t("en", key);
  if (isCircumferenceField(key)) {
    return `${base} (${t("en", "allAround")})`;
  }
  return base;
}

function TypeSection({ type }: { type: MeasurementTypeId }) {
  const theme = MEASUREMENT_TYPE_THEMES[type];
  const fields = fieldsForType(type);

  return (
    <section className={`rounded-2xl border-2 ${theme.rowBorder} ${theme.rowBg} p-4 sm:p-6`}>
      <h2 className={`mb-4 text-xl font-bold ${theme.accent}`}>{TYPE_TITLES[type]}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <li
            key={f.key}
            className="flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-white px-3 py-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={measurementIconPath(type, f.key)}
              alt=""
              width={92}
              height={58}
              className="h-[58px] w-[92px] shrink-0 rounded-lg border border-zinc-200/90 object-cover"
            />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${theme.accent}`}>{fieldTitle(type, f.key)}</p>
              <p className="truncate font-mono text-[10px] text-zinc-400">
                {type}/{f.key}.png
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MeasurementIconsPreviewPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Measurement field icons</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Icons cropped from your reference screenshot — full white card + figure + measurement line,
            exactly as in the tailoring app.
          </p>
        </header>

        <MeasurementAppPreview />

        {MEASUREMENT_TYPES.map((type) => (
          <TypeSection key={type} type={type} />
        ))}
      </div>
    </main>
  );
}
