/**
 * Generates docs/LK-Studio-Application-Brief.pdf — product overview with screenshots.
 * Run: npm run docs:app-brief
 */
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";

const BRAND_GREEN: [number, number, number] = [27, 48, 34];
const BRAND_GOLD: [number, number, number] = [201, 162, 39];
const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ROOT = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT, "docs", "app-brief", "screenshots");
const OUT_PATH = path.join(ROOT, "docs", "LK-Studio-Application-Brief.pdf");

type DocState = { doc: jsPDF; y: number };

function newDoc(): DocState {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  return { doc, y: 0 };
}

function ensureSpace(state: DocState, needed: number) {
  if (state.y + needed > PAGE_H - MARGIN) {
    state.doc.addPage();
    state.y = MARGIN;
  }
}

function drawHeader(state: DocState, title: string, subtitle?: string) {
  const { doc } = state;
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, PAGE_W, subtitle ? 36 : 28, "F");
  doc.setTextColor(...BRAND_GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("LK STUDIO", MARGIN, 10);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(title, MARGIN, 20);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, MARGIN, 28);
  }
  state.y = subtitle ? 44 : 36;
}

function sectionTitle(state: DocState, text: string) {
  ensureSpace(state, 14);
  const { doc } = state;
  doc.setTextColor(...BRAND_GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(text, MARGIN, state.y);
  state.y += 8;
}

function bodyText(state: DocState, text: string, indent = 0) {
  const { doc } = state;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, CONTENT_W - indent);
  for (const line of lines) {
    ensureSpace(state, 5);
    doc.text(line, MARGIN + indent, state.y);
    state.y += 5;
  }
  state.y += 2;
}

function bulletList(state: DocState, items: string[], indent = 4) {
  for (const item of items) {
    const prefix = "• ";
    const { doc } = state;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(prefix + item, CONTENT_W - indent);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(state, 5);
      doc.text(lines[i], MARGIN + indent, state.y);
      state.y += 5;
    }
  }
  state.y += 2;
}

function tableBlock(state: DocState, headers: string[], rows: string[][]) {
  const { doc } = state;
  const colCount = headers.length;
  const colW = CONTENT_W / colCount;
  ensureSpace(state, 8 + rows.length * 6);
  doc.setFillColor(248, 246, 237);
  doc.setDrawColor(...BRAND_GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_GREEN);
  let x = MARGIN;
  for (const h of headers) {
    doc.rect(x, state.y - 4, colW, 7, "FD");
    doc.text(h, x + 2, state.y);
    x += colW;
  }
  state.y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  for (const row of rows) {
    x = MARGIN;
    for (const cell of row) {
      doc.rect(x, state.y - 4, colW, 6, "S");
      const lines = doc.splitTextToSize(cell, colW - 3);
      doc.text(lines[0] ?? "", x + 2, state.y);
      x += colW;
    }
    state.y += 6;
  }
  state.y += 4;
}

function loadImageBase64(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function addScreenshot(state: DocState, fileName: string, caption: string) {
  const full = path.join(SCREENSHOTS_DIR, fileName);
  const data = loadImageBase64(full);
  if (!data) {
    bodyText(state, `[Screenshot missing: ${fileName}]`);
    return;
  }
  const imgW = CONTENT_W * 0.55;
  const imgH = imgW * (16 / 9);
  ensureSpace(state, imgH + 14);
  sectionTitle(state, caption);
  state.doc.addImage(data, "PNG", MARGIN, state.y, imgW, imgH);
  state.y += imgH + 6;
}

function addCover(state: DocState) {
  const { doc } = state;
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(...BRAND_GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("LK Studio", MARGIN, 80);
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Application Brief", MARGIN, 95);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Multi-shop tailor platform for shops, customers, and admin", MARGIN, 110);
  doc.text("Production: https://lk-studio-1.onrender.com", MARGIN, 120);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, MARGIN, 135);

  const hero = loadImageBase64(path.join(SCREENSHOTS_DIR, "01-home.png"));
  if (hero) {
    const w = 70;
    const h = w * 1.85;
    doc.addImage(hero, "PNG", PAGE_W - MARGIN - w, 60, w, h);
  }

  doc.addPage();
  state.y = MARGIN;
}

function buildPdf(): jsPDF {
  const state = newDoc();
  addCover(state);

  drawHeader(state, "Overview", "What is LK Studio?");
  bodyText(
    state,
    "LK Studio is a SaaS-style tailoring platform that connects tailor shops with customers across India. " +
      "Each shop runs its own digital workspace — designs, orders, measurements, bills, and subscriptions — " +
      "while customers browse catalogs, save family measurements, place stitching or repair orders, and track progress. " +
      "A central admin manages the shared design catalog (Maggam, Blouse, Dress, etc.) used by all shops."
  );
  bodyText(
    state,
    "The app works in the browser (desktop and mobile), can be installed as a PWA, and is packaged as an Android app (AAB/APK) via Capacitor."
  );

  sectionTitle(state, "Three user roles");
  tableBlock(state, ["Role", "Who", "Main access"], [
    ["Admin", "LK Studio team", "Catalog upload, shop oversight, platform settings"],
    ["Shop", "Tailor / boutique owner", "Orders, bills, own designs, customer measurements"],
    ["Customer", "End user / family", "Browse designs, place orders, bills, favorites"],
  ]);

  drawHeader(state, "How it works", "End-to-end example");
  bodyText(state, "Example: Customer orders a Maggam blouse design");
  bulletList(state, [
    "Customer registers with mobile number (+91), starts a 30-day trial subscription.",
    "Adds family members (Persons) and saves blouse/dress measurements with visual guides.",
    "Opens Designs → Maggam → picks Small / Medium / Big tier → selects a design.",
    "Chooses a shop, uploads reference photos (camera or gallery), and submits the order.",
    "Shop sees the order on the dashboard, updates status: Pending → Measuring → Stitching → Ready → Delivered.",
    "Shop creates a bill with amount, advance, and paid/pending; customer views it in Bills.",
    "Optional: customer requests a price quote before ordering; shop responds from Price Requests.",
  ]);

  bodyText(state, "Admin catalog workflow (shared designs for all shops):");
  bulletList(state, [
    "Admin logs in at /login/admin.",
    "Bulk upload photos → designs land in Unassigned.",
    "Open Unassigned, tick designs, assign Small / Medium / Big (or Blouses / Hand sleeves for blouse/dress).",
    "Assigned designs appear in customer and shop catalog views; unassigned stay admin-only.",
  ]);

  state.doc.addPage();
  state.y = MARGIN;
  drawHeader(state, "Screenshots", "Key screens from production");

  const shots: { file: string; caption: string }[] = [
    { file: "01-home.png", caption: "Home — Register, Shop login, Customer login" },
    { file: "02-shop-login.png", caption: "Shop login — Mobile number + password / OTP" },
    { file: "03-customer-login.png", caption: "Customer login — Same mobile-first flow" },
  ];
  for (const s of shots) addScreenshot(state, s.file, s.caption);

  drawHeader(state, "Shop owner features");
  bulletList(state, [
    "Dashboard: order counts by status, recent orders, weekly/monthly bill totals.",
    "Designs: upload shop-specific designs by category (Maggam, Embroidery, Blouse, etc.).",
    "Orders: create and manage orders; view customer measurements and photos.",
    "Bill book: amounts, advance, paid flag, voice notes, PDF earnings reports.",
    "Profile: shop name, address, timings, phone, WhatsApp, Instagram, UPI ID & QR.",
    "Reports: earnings summary with export to PDF.",
    "Subscription: 30-day trial, monthly plan via Razorpay (demo/production).",
    "Workers, price requests, customer favorites.",
  ]);

  drawHeader(state, "Customer features");
  bulletList(state, [
    "Family members (Persons) with saved measurements (blouse, dress, child).",
    "Browse admin catalog and shop designs by category and size tier.",
    "Place stitching or repair orders with multiple photos.",
    "Track order status and view bills (advance / paid / pending).",
    "Save favorite designs and shops; contact shop via phone/WhatsApp.",
    "Price requests and subscription management.",
    "Languages: English, Telugu, Hindi — switch from header.",
  ]);

  drawHeader(state, "Admin features");
  bulletList(state, [
    "Bulk catalog upload (no 100-image cap) with image normalization (Sharp).",
    "Unassigned → select → bulk assign size tier or catalog part.",
    "Manage shops list and per-shop details.",
    "Catalog categories: Maggam, Computer embroidery, Blouse design, Dress model, Children's wear, Stitched designs.",
  ]);

  state.doc.addPage();
  state.y = MARGIN;
  drawHeader(state, "Technology stack");

  sectionTitle(state, "Frontend");
  bulletList(state, [
    "Next.js 15 (App Router) — React 19, TypeScript",
    "Tailwind CSS 4 — responsive mobile-first UI",
    "i18next — English, Telugu, Hindi",
    "Lucide React — icons",
    "html2canvas + jsPDF — client-side PDF (e.g. earnings reports)",
    "Capacitor 6 — Android native shell (camera, geolocation, share, filesystem)",
    "PWA manifest — Add to Home Screen on mobile browsers",
  ]);

  sectionTitle(state, "Backend & APIs");
  bulletList(state, [
    "Next.js Route Handlers (API routes under src/app/api/)",
    "Prisma ORM 6 — PostgreSQL (Supabase in production)",
    "JWT session cookies (jose) + bcrypt password hashing",
    "Zod — request validation",
    "Sharp — server-side image normalize/compress on upload",
    "Razorpay — subscriptions and autopay",
    "OTP login flow (LoginOtp model) with trusted devices",
  ]);

  sectionTitle(state, "Storage & infrastructure");
  bulletList(state, [
    "Database: PostgreSQL via Supabase (DATABASE_URL)",
    "File storage: Cloudflare R2 (default production), optional AWS S3 or Supabase Storage",
    "Hosting: Render (https://lk-studio-1.onrender.com)",
    "Android release: AAB built with Capacitor (npm run build:aab:release)",
  ]);

  sectionTitle(state, "Security & legal");
  bulletList(state, [
    "Role-based access: SHOP, CUSTOMER, ADMIN",
    "Session versioning and secure cookies in production",
    "Terms include shop stitched-design catalog license for LK Studio marketing use",
    "Privacy and terms pages at /terms and /privacy",
  ]);

  drawHeader(state, "Demo accounts & URLs");
  tableBlock(state, ["Role", "URL / Mobile", "Password"], [
    ["Admin", "https://lk-studio-1.onrender.com/login/admin · 9000000001", "lkstudio123"],
    ["Shop demo", "/login/shop · 9876543210", "demo123"],
    ["Customer demo", "/login/customer · 9876543219", "demo123"],
  ]);
  bodyText(
    state,
    "Reseed demo data locally: npm run db:seed-demo and npm run db:seed-admin. " +
      "Login uses Indian mobile numbers only — no email required for day-to-day use."
  );

  sectionTitle(state, "Order status flow");
  bodyText(state, "Pending → Measuring → Stitching → Ready → Delivered (or Cancelled)");

  sectionTitle(state, "Repository scripts (developer)");
  bulletList(state, [
    "npm run dev — local development",
    "npm run dev:anywhere — HTTPS tunnel for phone testing",
    "npm run db:push / db:seed — database setup",
    "npm run build:aab:release — Android App Bundle for Play Store",
    "npm run launch:check — pre-release health checks",
  ]);

  const { doc } = state;
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`LK Studio Application Brief — Page ${i} of ${pageCount}`, MARGIN, PAGE_H - 6);
  }

  return doc;
}

function main() {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.warn("No screenshots folder — PDF will note missing images.");
  }
  const doc = buildPdf();
  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(OUT_PATH, buf);
  console.log(`Wrote ${OUT_PATH} (${(buf.length / 1024).toFixed(1)} KB)`);
}

main();
