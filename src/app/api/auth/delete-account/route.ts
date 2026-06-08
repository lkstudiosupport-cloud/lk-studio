import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { deleteCustomerAccount, deleteShopAccount } from "@/lib/delete-account";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (session.role === "CUSTOMER") {
      await deleteCustomerAccount(session.id);
    } else if (session.role === "SHOP") {
      if (!session.shopId) {
        return NextResponse.json({ error: "Shop profile not found" }, { status: 400 });
      }
      await deleteShopAccount(session.id, session.shopId);
    } else {
      return NextResponse.json({ error: "Unsupported account type" }, { status: 400 });
    }

    await clearSession();
    return NextResponse.json({ ok: true, redirect: "/" });
  } catch (err) {
    console.error("Delete account error:", err);
    const message = err instanceof Error ? err.message : "Could not delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
