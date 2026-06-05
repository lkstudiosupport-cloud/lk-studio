import { formatMoney } from "@/lib/bill-items";
import type { ReportBillRow, ReportSummary } from "@/lib/shop-report";
import { billBalance } from "@/lib/shop-report";
import { billReceived } from "@/lib/income";

const BRAND_GREEN: [number, number, number] = [27, 48, 34];
const BRAND_GOLD: [number, number, number] = [201, 162, 39];
const BRAND_CREAM: [number, number, number] = [248, 246, 237];
const ROW_ALT: [number, number, number] = BRAND_CREAM;

function formatBillDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRupee(amount: number) {
  return `\u20B9${formatMoney(amount)}`;
}

function shortBillNo(billNumber: string) {
  if (billNumber.length <= 16) return billNumber;
  return `${billNumber.slice(0, 10)}\n${billNumber.slice(10)}`;
}

export async function downloadEarningsReportPdf({
  shopName,
  periodLabel,
  modeLabel,
  summary,
  bills,
  labels,
  appName = "LK Studio",
}: {
  shopName: string;
  periodLabel: string;
  modeLabel: string;
  summary: ReportSummary;
  bills: ReportBillRow[];
  labels: {
    title: string;
    billNo: string;
    date: string;
    customer: string;
    amount: string;
    advance: string;
    paid: string;
    received: string;
    pending: string;
    totalRaised: string;
    totalReceived: string;
    totalPending: string;
    billCount: string;
    noBills: string;
    total: string;
  };
  appName?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(...BRAND_GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(appName.toUpperCase(), margin, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(labels.title, margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(shopName, margin, 26);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.text(`${modeLabel}: ${periodLabel}`, pageWidth - margin, 38, { align: "right" });

  autoTable(doc, {
    startY: 44,
    theme: "plain",
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    body: [
      [
        { content: labels.billCount, styles: { fontStyle: "bold", textColor: BRAND_GREEN } },
        { content: String(summary.billCount), styles: { halign: "right" } },
        { content: labels.totalRaised, styles: { fontStyle: "bold", textColor: BRAND_GREEN } },
        { content: formatRupee(summary.totalRaised), styles: { halign: "right", fontStyle: "bold" } },
      ],
      [
        { content: labels.totalReceived, styles: { fontStyle: "bold", textColor: BRAND_GREEN } },
        { content: formatRupee(summary.totalReceived), styles: { halign: "right", fontStyle: "bold" } },
        { content: labels.totalPending, styles: { fontStyle: "bold", textColor: BRAND_GREEN } },
        { content: formatRupee(summary.totalPending), styles: { halign: "right" } },
      ],
    ],
    styles: {
      fontSize: 10,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.28 },
      1: { cellWidth: contentWidth * 0.22 },
      2: { cellWidth: contentWidth * 0.28 },
      3: { cellWidth: contentWidth * 0.22 },
    },
    didDrawCell(data) {
      if (data.section === "body" && data.row.index === 0) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        const y = data.cell.y + data.cell.height;
        doc.line(margin, y, pageWidth - margin, y);
      }
    },
  });

  const tableStartY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  if (bills.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(labels.noBills, margin, tableStartY + 10);
  } else {
    const body = bills.map((bill) => {
      const received = billReceived(bill.advancePaid, bill.paidAmount);
      const pending = billBalance(bill.amount, bill.advancePaid, bill.paidAmount);
      return [
        formatBillDate(bill.createdAt),
        shortBillNo(bill.billNumber),
        bill.customerName,
        formatRupee(bill.amount),
        formatRupee(received),
        formatRupee(pending),
      ];
    });

    autoTable(doc, {
      startY: tableStartY + 6,
      head: [[labels.date, labels.billNo, labels.customer, labels.amount, labels.received, labels.pending]],
      body,
      foot: [
        [
          { content: labels.total, colSpan: 3, styles: { halign: "right" } },
          formatRupee(summary.totalRaised),
          formatRupee(summary.totalReceived),
          formatRupee(summary.totalPending),
        ],
      ],
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: {
        fontSize: 9,
        cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
        overflow: "linebreak",
        valign: "middle",
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: BRAND_GREEN,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 32, fontSize: 8 },
        2: { cellWidth: 44 },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 24, halign: "right" },
      },
      alternateRowStyles: { fillColor: ROW_ALT },
      footStyles: {
        fillColor: BRAND_CREAM,
        textColor: BRAND_GREEN,
        fontStyle: "bold",
        fontSize: 9,
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index >= 3) {
          data.cell.styles.halign = "right";
        }
        if (data.section === "foot" && data.column.index >= 3) {
          data.cell.styles.halign = "right";
        }
      },
    });
  }

  const pageCount = doc.getNumberOfPages();
  const generated = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${appName} · ${generated}`, margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const safeName = shopName.replace(/[^\w\-]+/g, "_").slice(0, 40);
  doc.save(`${safeName}-earnings-report.pdf`);
}
