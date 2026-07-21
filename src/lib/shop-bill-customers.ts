import { prisma } from "@/lib/prisma";

export type ShopBillCustomer = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
};

/** Recent shop customers for bill/order pickers — indexed, capped, no full-table scan. */
export async function listShopBillCustomers(
  shopId: string,
  limit = 80
): Promise<ShopBillCustomer[]> {
  const [orderRows, billRows] = await Promise.all([
    prisma.order.findMany({
      where: { shopId },
      select: {
        customer: { select: { id: true, name: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.bill.findMany({
      where: { shopId },
      select: {
        customerId: true,
        customerName: true,
        customerPhone: true,
        customer: { select: { id: true, name: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const byId = new Map<string, ShopBillCustomer>();
  const byNameKey = new Map<string, ShopBillCustomer>();

  function add(c: ShopBillCustomer) {
    if (!c.name.trim()) return;
    if (byId.has(c.id)) return;
    byId.set(c.id, c);
    const key = `${c.name.trim().toLowerCase()}|${(c.phone || c.whatsapp || "").replace(/\D/g, "")}`;
    if (!byNameKey.has(key)) byNameKey.set(key, c);
  }

  for (const row of orderRows) {
    if (row.customer) add(row.customer);
  }

  for (const row of billRows) {
    if (row.customer) {
      add(row.customer);
      continue;
    }
    const name = (row.customerName ?? "").trim();
    if (!name) continue;
    const phone = row.customerPhone?.trim() || null;
    const key = `${name.toLowerCase()}|${(phone || "").replace(/\D/g, "")}`;
    if (byNameKey.has(key)) continue;
    const synthetic: ShopBillCustomer = {
      id: `walkin-${key}`,
      name,
      phone,
      whatsapp: phone,
    };
    byNameKey.set(key, synthetic);
    byId.set(synthetic.id, synthetic);
  }

  return [...byId.values()].slice(0, limit);
}
