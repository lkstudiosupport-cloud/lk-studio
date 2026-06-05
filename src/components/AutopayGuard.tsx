"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Redirect to autopay setup until mandate is completed (registration onboarding). */
export function AutopayGuard({
  autopayEnabled,
  setupPath,
  children,
}: {
  autopayEnabled: boolean;
  setupPath: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const onSetupPage = pathname === setupPath || pathname.startsWith(`${setupPath}/`);

  useEffect(() => {
    if (!autopayEnabled && !onSetupPage) {
      router.replace(setupPath);
    }
  }, [autopayEnabled, onSetupPage, setupPath, router]);

  if (!autopayEnabled && !onSetupPage) {
    return null;
  }

  return <>{children}</>;
}
