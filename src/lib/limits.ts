/** Max rows loaded per list page — keeps memory and response time stable at scale. */
export const LIST_PAGE_SIZE = 60;

/** Max orders shown on shop dashboard preview. */
export const DASHBOARD_ORDER_LIMIT = 40;

/** Max designs per shop gallery load. */
export const DESIGN_LIST_LIMIT = 200;

/** Max photos per shop design (cover + gallery). */
export const MAX_DESIGN_IMAGES = 2;

/** Max upload size (bytes) — 8 MB. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** API requests per IP per minute (login, upload, register). */
export const RATE_LIMIT_PER_MINUTE = 120;
