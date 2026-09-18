/** Cookie distinguishing Play Store shells on the shared Render host. */
export const APP_SURFACE_COOKIE = "lk_app_surface";

export type AppSurface = "studio" | "partner" | "designs";

export function parseAppSurface(value: string | undefined | null): AppSurface {
  if (value === "partner") return "partner";
  if (value === "designs") return "designs";
  return "studio";
}

export function homePathForSurface(surface: AppSurface): string {
  if (surface === "partner") return "/work-partner";
  if (surface === "designs") return "/designs";
  return "/";
}
