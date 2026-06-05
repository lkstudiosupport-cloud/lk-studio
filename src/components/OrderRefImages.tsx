import Image from "next/image";
import { parseRefImages } from "@/lib/order-images";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function OrderRefImages({
  customerRefImages,
  locale,
}: {
  customerRefImages: string | null;
  locale: Locale;
}) {
  const images = parseRefImages(customerRefImages);
  if (images.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-rose-700">{t(locale, "customerRefImages")}</p>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-rose-200">
            <Image src={src} alt={`Ref ${i + 1}`} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>
    </div>
  );
}
