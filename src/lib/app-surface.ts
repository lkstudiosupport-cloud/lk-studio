/** Cookie distinguishing Play Store shells on the shared Render host. */
export const APP_SURFACE_COOKIE = "lk_app_surface";

export type AppSurface = "studio" | "partner";

export function parseAppSurface(value: string | undefined | null): AppSurface {
  return value === "partner" ? "partner" : "studio";
}
