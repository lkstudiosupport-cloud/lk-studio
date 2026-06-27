/** Designs shown per grid page — keeps memory and payload small at 5000+ catalog size. */
export const CATALOG_PAGE_SIZE = 48;

/** Total catalog designs the app is designed to support (paginated, not loaded at once). */
export const CATALOG_MAX_DESIGNS = 5000;

/** Max rows loaded per list page — keeps memory and response time stable at scale. */
export const LIST_PAGE_SIZE = 60;

/** Max orders shown on shop dashboard preview. */
export const DASHBOARD_ORDER_LIMIT = 40;

/** @deprecated Use CATALOG_PAGE_SIZE — first page only. */
export const DESIGN_LIST_LIMIT = CATALOG_PAGE_SIZE;

/** @deprecated Catalog is paginated; do not load all rows in one query. */
export const CATALOG_LIST_LIMIT = CATALOG_PAGE_SIZE;

/** Max photos per shop design (cover + gallery). */
export const MAX_DESIGN_IMAGES = 2;

/** Admin catalog uploads per IP per minute (one request per photo). */
export const ADMIN_CATALOG_UPLOAD_RATE_PER_MINUTE = 2000;

/** Max reference photos per person profile. */
export const MAX_PERSON_PHOTOS = 3;

/** Max photos per order upload batch (customer/shop work photos). */
export const MAX_ORDER_UPLOAD_PHOTOS = 8;

/** Max upload size (bytes) — 8 MB. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** API requests per IP per minute (login, upload, register). */
export const RATE_LIMIT_PER_MINUTE = 120;

/** Max page number for catalog API (48 × 105 ≈ 5040 designs). */
export const CATALOG_MAX_PAGE = Math.ceil(CATALOG_MAX_DESIGNS / CATALOG_PAGE_SIZE) + 5;
