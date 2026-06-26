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
