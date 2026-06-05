import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { prisma } from "@/lib/prisma";
import { billCustomerName } from "@/lib/bill-customer";
import { formatRangeLabel, resolveReportRange, type ReportMode } from "@/lib/report-period";
import { summarizeReportBills, type ReportBillRow } from "@/lib/shop-report";
import { ShopReportPanel } from "@/components/ShopReportPanel";

export default async function ShopReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; period?: string }>;
}) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;
  const params = await searchParams;

  const mode: ReportMode = params.mode === "month" ? "month" : "week";
  const range = resolveReportRange(mode, params.period);

  const [shop, bills] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id: shopId },
      select: { shopName: true },
    }),
    prisma.bill.findMany({
      where: {
        shopId,
        createdAt: { gte: range.start, lt: range.end },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        billNumber: true,
        createdAt: true,
        customerName: true,
        amount: true,
        advancePaid: true,
        paidAmount: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  const rows: ReportBillRow[] = bills.map((b) => ({
    id: b.id,
    billNumber: b.billNumber,
    createdAt: b.createdAt,
    customerName: billCustomerName(b),
    amount: b.amount,
    advancePaid: b.advancePaid,
    paidAmount: b.paidAmount,
  }));

  const summary = summarizeReportBills(rows);
  const periodLabel = formatRangeLabel(range.mode, range.start, range.end);

  return (
    <ShopReportPanel
      locale={locale}
      shopName={shop?.shopName ?? "Shop"}
      mode={range.mode}
      period={range.period}
      periodLabel={periodLabel}
      summary={summary}
      bills={rows}
    />
  );
}
