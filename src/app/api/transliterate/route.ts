import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { transliterateLatinToLocale } from "@/lib/indic-transliterate";

export const dynamic = "force-dynamic";

/** Convert Latin/phonetic typing or speech into the selected Indic script. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text") ?? "";
  const localeRaw = (url.searchParams.get("locale") ?? "en").toLowerCase();
  const locale = (LOCALES.includes(localeRaw as Locale) ? localeRaw : "en") as Locale;

  if (!text || text.length > 500) {
    return NextResponse.json(
      { ok: false, text },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const converted = await transliterateLatinToLocale(text, locale);
  return NextResponse.json(
    { ok: true, text: converted, locale },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
