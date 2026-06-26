import {
  msg91TemplateId,
  msg91WidgetIdServer,
  msg91WidgetTokenServer,
} from "@/lib/msg91-config";

let cachedTemplate: { id: string; expiresAt: number } | null = null;

function deepFindTemplateId(obj: unknown, depth = 0): string | null {
  if (depth > 10 || obj == null) return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepFindTemplateId(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof obj !== "object") return null;

  const record = obj as Record<string, unknown>;
  for (const [key, val] of Object.entries(record)) {
    if (/template/i.test(key) && (typeof val === "string" || typeof val === "number")) {
      const s = String(val).trim();
      if (s.length >= 4 && s.length <= 64 && !/\s/.test(s)) return s;
    }
  }

  for (const val of Object.values(record)) {
    const found = deepFindTemplateId(val, depth + 1);
    if (found) return found;
  }

  return null;
}

async function templateFromWidgetProcess(): Promise<string | null> {
  const id = msg91WidgetIdServer();
  const token = msg91WidgetTokenServer();
  if (!id || !token) return null;

  const url = `https://control.msg91.com/api/v5/widget/getWidgetProcess?widgetId=${encodeURIComponent(id)}&tokenAuth=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const nested =
      data.data && typeof data.data === "object"
        ? (data.data as Record<string, unknown>)
        : data;

    return (
      deepFindTemplateId(nested?.widgetMeta) ??
      deepFindTemplateId(nested?.globalDefaultChannel) ??
      deepFindTemplateId(nested)
    );
  } catch (err) {
    console.error("MSG91 widget template lookup failed:", err);
    return null;
  }
}

/** Resolve DLT OTP template — env first, then widget configuration. */
export async function resolveMsg91TemplateId(): Promise<string | null> {
  const fromEnv = msg91TemplateId();
  if (fromEnv) return fromEnv;

  if (cachedTemplate && cachedTemplate.expiresAt > Date.now()) {
    return cachedTemplate.id;
  }

  const fromWidget = await templateFromWidgetProcess();
  if (fromWidget) {
    cachedTemplate = { id: fromWidget, expiresAt: Date.now() + 10 * 60 * 1000 };
    return fromWidget;
  }

  return null;
}
