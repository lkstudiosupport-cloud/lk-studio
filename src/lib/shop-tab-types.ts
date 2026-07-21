import type { OrderStatus, PriceRequestStatus, ServiceCategory, WorkerPartnerDurationType, WorkerPartnerRequestStatus, WorkerPartnerRole } from "@prisma/client";
import type { ShopOrderTabCounts } from "@/lib/order-stats";

export type ShopTabId = "dashboard" | "orders" | "bills" | "workers";

export type ShopDashboardTabData = {
  weeklyIncome: number;
  monthlyIncome: number;
  statusCounts: {
    pending: number;
    ready: number;
    completed: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    customerName: string;
    personName: string;
    designTitle: string | null;
  }>;
};

/** Light order row — enough for list card header + status; detail loads on expand/share. */
export type ShopOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  subjectName: string;
  designTitle: string | null;
};

export type ShopPriceRequestListItem = {
  id: string;
  status: PriceRequestStatus;
  category: ServiceCategory;
  quotedPrice: number | null;
  shopReply: string | null;
  notes: string | null;
  customerImagePath: string | null;
  customer: { id: string; name: string; phone: string | null };
  design: { id: string; title: string; imagePath: string } | null;
};

export type ShopOrdersTabData = {
  orders: ShopOrderListItem[];
  priceRequests: ShopPriceRequestListItem[];
  tabCounts: ShopOrderTabCounts;
  truncated: boolean;
  pageSize: number;
};

export type ShopBillListItem = {
  id: string;
  billNumber: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  itemsJson: string;
  notes: string | null;
  createdAt: string;
  displayName: string;
};

export type ShopBillsTabData = {
  tab: string;
  mode: string;
  period: string;
  periodLabel: string;
  total: number;
  counts: { all: number; pending: number; paid: number };
  bills: ShopBillListItem[];
};

export type ShopAcceptedPartner = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  address: string | null;
  locationLink: string | null;
  yearsExperience: number;
  ratingAvg: number | null;
  ratingCount: number;
};

export type ShopWorkerApplication = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  workerId: string;
  workerName: string;
  workerPhone: string | null;
  workerCity: string;
  jobsCompleted: number;
  ratingQualityAvg: number | null;
  ratingPerformanceAvg: number | null;
  profilePhoto: string | null;
};

export type ShopWorkerRequestListItem = {
  id: string;
  role: WorkerPartnerRole;
  customRole: string | null;
  neededFrom: string;
  durationType: WorkerPartnerDurationType;
  customDays: number | null;
  notes: string | null;
  city: string | null;
  status: WorkerPartnerRequestStatus;
  createdAt: string;
  acceptedAt: string | null;
  acceptedPartner: ShopAcceptedPartner | null;
  shopRating: number | null;
  applications: ShopWorkerApplication[];
};

export type ShopWorkersTabData = {
  requests: ShopWorkerRequestListItem[];
};

export type ShopTabPayloadMap = {
  dashboard: ShopDashboardTabData;
  orders: ShopOrdersTabData;
  bills: ShopBillsTabData;
  workers: ShopWorkersTabData;
};
