"use server";

import { requireSession } from "@/lib/auth";
import { isRazorpayConfigured } from "@/lib/razorpay-config";
import {
  activateAutopay,
  deactivateAutopay,
  grantSubscriptionPeriod,
  type AutopayRole,
} from "@/lib/subscription-autopay";

/** Local demo when Razorpay keys are not set (development / testing only). Shop only. */
export async function enableAutopayDemo(role: AutopayRole) {
  if (role !== "SHOP") {
    throw new Error("Customer accounts are free — no subscription");
  }
  if (isRazorpayConfigured()) {
    throw new Error("Use Razorpay autopay checkout");
  }

  const session = await requireSession([role]);
  if (!session || session.role !== role) throw new Error("Unauthorized");

  const entityId = session.shopId;
  if (!entityId) throw new Error("Account not found");

  await activateAutopay(role, entityId, {
    razorpaySubscriptionId: `demo_${role.toLowerCase()}_${entityId.slice(0, 8)}`,
  });
}

/** Local demo month-wise renew when Razorpay keys are not set. Shop only. */
export async function enableMonthlyDemo(role: AutopayRole) {
  if (role !== "SHOP") {
    throw new Error("Customer accounts are free — no subscription");
  }
  if (isRazorpayConfigured()) {
    throw new Error("Use Razorpay monthly checkout");
  }

  const session = await requireSession([role]);
  if (!session || session.role !== role) throw new Error("Unauthorized");

  const entityId = session.shopId;
  if (!entityId) throw new Error("Account not found");

  await grantSubscriptionPeriod(role, entityId);
}

export async function disableAutopayDemo(role: AutopayRole) {
  const session = await requireSession([role]);
  if (!session || session.role !== role) throw new Error("Unauthorized");

  const entityId = role === "SHOP" ? session.shopId : session.id;
  if (!entityId) throw new Error("Account not found");

  await deactivateAutopay(role, entityId);
}
