/** Shared bill receipt styles — hex/rgb only (safe for html2canvas capture). */
export const BILL_RECEIPT_STYLES = `
.bill-receipt {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 28rem;
}

.bill-receipt-paper {
  position: relative;
  overflow: visible;
  isolation: isolate;
  border: 2px dashed #a1a1aa;
  border-radius: 2px;
  background: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(27, 48, 34, 0.1);
}

.bill-receipt-content {
  position: relative;
  z-index: 1;
  padding-top: 5rem;
  padding-bottom: 5rem;
}

.bill-receipt-corners {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  user-select: none;
}

.bill-receipt-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 5.5rem;
  max-width: 22%;
}

.bill-receipt-corner--tl { top: 0.65rem; left: 0.65rem; align-items: flex-start; }
.bill-receipt-corner--tr { top: 0.65rem; right: 0.65rem; align-items: flex-end; }
.bill-receipt-corner--bl { bottom: 0.65rem; left: 0.65rem; align-items: flex-start; }
.bill-receipt-corner--br { bottom: 0.65rem; right: 0.65rem; align-items: flex-end; }

.bill-receipt-corner-mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
}

.bill-receipt-corner-mark::before,
.bill-receipt-corner-mark::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 145%;
  height: 3px;
  background: rgba(27, 48, 34, 0.48);
  border-radius: 2px;
  transform-origin: center;
  z-index: 0;
}

.bill-receipt-corner-mark::before { transform: translate(-50%, -50%) rotate(45deg); }
.bill-receipt-corner-mark::after { transform: translate(-50%, -50%) rotate(-45deg); }

.bill-receipt-corner-logo {
  position: relative;
  z-index: 1;
  width: 1rem !important;
  height: 1rem !important;
  border-radius: 0.2rem;
  object-fit: contain;
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.9);
}

.bill-receipt-corner-name {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(27, 48, 34, 0.72);
  text-align: center;
}

.bill-receipt-corner--tr .bill-receipt-corner-name,
.bill-receipt-corner--br .bill-receipt-corner-name { text-align: right; }

.bill-receipt-corner--tl .bill-receipt-corner-name,
.bill-receipt-corner--bl .bill-receipt-corner-name { text-align: left; }

.bill-receipt-header {
  border-bottom: 2px dashed #d4d4d8;
  padding: 1.5rem 1.25rem;
  text-align: center;
}

.bill-receipt-icon-wrap {
  margin: 0 auto 0.75rem;
  display: flex;
  height: 3.5rem;
  width: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(27, 48, 34, 0.2);
}

.bill-receipt-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bill-receipt-icon-wrap svg {
  height: 2rem;
  width: 3rem;
  color: #f1d35e;
}

.bill-receipt-shop-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #1b3022;
  word-break: break-word;
}

.bill-receipt-subtitle {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c9ab4a;
}

.bill-receipt-brand-row {
  margin: 0.75rem auto 0;
  display: flex;
  max-width: 14rem;
  align-items: center;
  gap: 0.5rem;
}

.bill-receipt-brand-line {
  height: 1px;
  flex: 1;
  background: rgba(27, 48, 34, 0.25);
}

.bill-receipt-brand-label {
  font-size: 0.875rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1b3022;
}

.bill-receipt-address,
.bill-receipt-header-phone {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #3f3f46;
}

.bill-receipt-header-phone { margin-top: 0.25rem; color: #52525b; }

.bill-receipt-meta {
  border-bottom: 1px dashed #d4d4d8;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
}

.bill-receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.bill-receipt-row:first-child { margin-top: 0; }

.bill-receipt-row-label {
  flex-shrink: 0;
  color: #71717a;
}

.bill-receipt-row-value {
  text-align: right;
  font-weight: 600;
  color: #1b3022;
  word-break: break-word;
  max-width: 62%;
}

.bill-receipt-row-value--strong { font-weight: 700; color: #1b3022; }

.bill-receipt-items {
  overflow: visible;
  padding: 1rem 1.25rem;
}

.bill-receipt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.8125rem;
}

.bill-receipt-table thead tr {
  border-bottom: 2px solid #27272a;
}

.bill-receipt-table th {
  padding: 0 0.35rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  vertical-align: bottom;
  color: #27272a;
}

.bill-receipt-table th.bill-receipt-th-qty { width: 2.25rem; text-align: center; }
.bill-receipt-table th.bill-receipt-th-price { width: 4.25rem; text-align: right; }
.bill-receipt-table th.bill-receipt-th-total { width: 4.5rem; text-align: right; }
.bill-receipt-table th.bill-receipt-th-sno { width: 1.75rem; }

.bill-receipt-table td {
  padding: 0.6rem 0.35rem 0.6rem 0;
  vertical-align: top;
  border-bottom: 1px dotted #e4e4e7;
  line-height: 1.35;
}

.bill-receipt-table td.bill-receipt-td-sno { color: #71717a; padding-right: 0.25rem; }
.bill-receipt-table td.bill-receipt-td-item {
  font-weight: 500;
  color: #18181b;
  word-break: break-word;
  overflow-wrap: anywhere;
  padding-right: 0.35rem;
}
.bill-receipt-table td.bill-receipt-td-qty { text-align: center; color: #18181b; }
.bill-receipt-table td.bill-receipt-td-price,
.bill-receipt-table td.bill-receipt-td-total {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.bill-receipt-table td.bill-receipt-td-total { font-weight: 700; color: #1b3022; }

.bill-receipt-totals {
  border-top: 2px dashed #d4d4d8;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
}

.bill-receipt-grand-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  background: rgba(250, 246, 238, 0.95);
  padding: 0.65rem 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1b3022;
}

.bill-receipt-payments {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dotted #e4e4e7;
}

.bill-receipt-pay-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.bill-receipt-pay-row span:last-child { font-weight: 600; font-variant-numeric: tabular-nums; }
.bill-receipt-pay-row--advance { color: #92400e; }
.bill-receipt-pay-row--paid { color: #065f46; }
.bill-receipt-pay-row--pending {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #be123c;
}

.bill-receipt-paid-banner {
  background: #059669;
  padding: 0.5rem 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ffffff;
}

.bill-receipt-notes {
  border-top: 1px dashed #d4d4d8;
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #52525b;
}

.bill-receipt-notes strong { color: #3f3f46; }

.bill-receipt-upi {
  border-top: 1px dashed #d4d4d8;
  padding: 1rem 1.25rem;
  text-align: center;
}

.bill-receipt-upi-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1b3022;
}

.bill-receipt-upi-value {
  margin: 0.25rem 0 0;
  font-family: ui-monospace, monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1b3022;
  word-break: break-all;
}

.bill-receipt-footer {
  border-top: 2px dashed #d4d4d8;
  padding: 1.25rem;
  text-align: center;
}

.bill-receipt-footer-thanks {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1b3022;
}

.bill-receipt-footer-sub {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #71717a;
}
`;
