/** MSG91 env helpers — server routes must prefer non-NEXT_PUBLIC vars (runtime on Render). */

export function msg91AuthKey(): string | null {
  return process.env.MSG91_AUTH_KEY?.trim() || null;
}

/** Widget ID for server-side send/verify (runtime env — not inlined at build). */
export function msg91WidgetIdServer(): string | null {
  return (
    process.env.MSG91_WIDGET_ID?.trim() ||
    process.env.NEXT_PUBLIC_MSG91_WIDGET_ID?.trim() ||
    null
  );
}

/** Widget token for server-side send/verify (runtime env — not inlined at build). */
export function msg91WidgetTokenServer(): string | null {
  return (
    process.env.MSG91_WIDGET_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN?.trim() ||
    null
  );
}

export function isMsg91WidgetServerSendConfigured(): boolean {
  return Boolean(msg91WidgetIdServer() && msg91WidgetTokenServer());
}

/** True when runtime-only widget vars are set (recommended for production OTP). */
export function isMsg91WidgetRuntimeConfigured(): boolean {
  return Boolean(
    process.env.MSG91_WIDGET_ID?.trim() && process.env.MSG91_WIDGET_TOKEN?.trim()
  );
}

export type Msg91WidgetProbe = {
  ok: boolean;
  error?: string;
  /** Template ID from widget config, if MSG91 returns one (Flow API fallback). */
  templateId?: string;
  /** Top-level keys returned by getWidgetProcess (for dashboard debugging). */
  processKeys?: string[];
};

function templateIdFromWidgetProcess(data: Record<string, unknown>): string | undefined {
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : undefined;
  const process =
    nested?.process && typeof nested.process === "object"
      ? (nested.process as Record<string, unknown>)
      : undefined;

  const candidates = [
    data.template_id,
    data.templateId,
    data.dlt_template_id,
    nested?.template_id,
    nested?.templateId,
    nested?.dlt_template_id,
    process?.template_id,
    process?.templateId,
    process?.dlt_template_id,
    process?.sms_template_id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
    if (typeof c === "number") return String(c);
  }
  return undefined;
}

/** Validate widget ID + token against MSG91 (no SMS sent). */
export async function probeMsg91Widget(): Promise<Msg91WidgetProbe | null> {
  const id = msg91WidgetIdServer();
  const token = msg91WidgetTokenServer();
  if (!id || !token) return null;

  const url = `https://control.msg91.com/api/v5/widget/getWidgetProcess?widgetId=${encodeURIComponent(id)}&tokenAuth=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* ignore */
    }

    const templateId = templateIdFromWidgetProcess(data);
    const processKeys = Object.keys(data).slice(0, 20);

    if (data.type === "success" || res.ok) {
      return { ok: true, ...(templateId ? { templateId } : {}), processKeys };
    }
    return {
      ok: false,
      error: typeof data.message === "string" ? data.message : `HTTP ${res.status}`,
      ...(templateId ? { templateId } : {}),
      processKeys,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Widget probe failed",
    };
  }
}

export function msg91TemplateId(): string | null {
  return process.env.MSG91_TEMPLATE_ID?.trim() || null;
}

export function isMsg91FlowConfigured(): boolean {
  return Boolean(msg91AuthKey() && msg91TemplateId());
}

export type OtpConfigStatus = {
  flowApi: boolean;
  widgetSend: boolean;
  widgetRuntime: boolean;
  authKey: boolean;
};

export function otpConfigStatus(): OtpConfigStatus {
  return {
    flowApi: isMsg91FlowConfigured(),
    widgetSend: isMsg91WidgetServerSendConfigured(),
    widgetRuntime: isMsg91WidgetRuntimeConfigured(),
    authKey: Boolean(msg91AuthKey()),
  };
}
