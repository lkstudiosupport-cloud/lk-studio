/** Self-contained order share card styles — hex/rgb only (safe for html2canvas + iframe capture). */
export const ORDER_WORK_SHARE_STYLES = `
.order-work-share {
  width: 400px;
  max-width: 400px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(26, 77, 62, 0.15);
  background: #ffffff;
  font-family: "Poppins", "Segoe UI", system-ui, sans-serif;
  color: #1a4d3e;
}

.order-work-share-header {
  background: #1a4d3e;
  padding: 12px 16px;
  color: #ffffff;
}

.order-work-share-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.order-work-share-sub {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
}

.order-work-share-meta {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
}

.order-work-share-body {
  padding: 16px;
}

.order-work-share-section {
  margin-bottom: 16px;
}

.order-work-share-section:last-child {
  margin-bottom: 0;
}

.order-work-share-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #1a4d3e;
}

.order-work-share-measures {
  margin: 0;
  padding: 12px;
  list-style: none;
  border-radius: 12px;
  background: #faf6ef;
  font-size: 14px;
}

.order-work-share-measures li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.order-work-share-measures li:last-child {
  margin-bottom: 0;
}

.order-work-share-measures .name {
  color: #52525b;
}

.order-work-share-measures .value {
  font-weight: 700;
}

.order-work-share-photos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.order-work-share-photo {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(26, 77, 62, 0.1);
  background: #f4f4f5;
}

.order-work-share-photo img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.order-work-share-notes {
  padding: 12px;
  border-radius: 12px;
  background: #fafafa;
  font-size: 14px;
}

.order-work-share-notes p {
  margin: 0;
}

.order-work-share-notes .note-body {
  margin-top: 4px;
  color: #3f3f46;
}

.order-work-share-footer {
  margin: 16px 0 0;
  text-align: center;
  font-size: 12px;
  color: #71717a;
}
`;
