import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { convertTextToLocale } from "@/lib/locale-text-convert";

export const dynamic = "force-dynamic";

/** Convert entered text to match the newly selected app language. */
export async function POST(req: Request) {
  let body: { text?: string; toLocale?: string };
  try {
    body = (await req.json()) as { text?: string; toLocale?: string };
  } catch {
    return NextResponse.json({ ok: false, text: "" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const localeRaw = (body.toLocale ?? "en").toLowerCase();
  const toLocale = (LOCALES.includes(localeRaw as Locale) ? localeRaw : "en") as Locale;

  if (text.length > 2000) {
    return NextResponse.json(
      { ok: false, text },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const converted = await convertTextToLocale(text, toLocale);
  return NextResponse.json(
    { ok: true, text: converted, toLocale },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
