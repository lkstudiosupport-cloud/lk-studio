"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Redirect to autopay setup when trial ended and mandate not completed. */
export function AutopayGuard({
  autopayEnabled,
  /** Demo accounts or active free trial — app works without mandate. */
  trialBypass = false,
  setupPath,
  children,
}: {
  autopayEnabled: boolean;
  trialBypass?: boolean;
  setupPath: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const onSetupPage = pathname === setupPath || pathname.startsWith(`${setupPath}/`);
  const mustSetup = !autopayEnabled && !trialBypass;

  useEffect(() => {
    if (mustSetup && !onSetupPage) {
      router.replace(setupPath);
    }
  }, [mustSetup, onSetupPage, setupPath, router]);

  if (mustSetup && !onSetupPage) {
    return null;
  }

  return <>{children}</>;
}
