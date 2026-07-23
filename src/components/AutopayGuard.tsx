"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Redirect to payment setup when trial/paid period ended and access is locked. */
export function AutopayGuard({
  hasAccess,
  setupPath,
  children,
}: {
  hasAccess: boolean;
  setupPath: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const onSetupPage = pathname === setupPath || pathname.startsWith(`${setupPath}/`);
  const mustSetup = !hasAccess;

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
