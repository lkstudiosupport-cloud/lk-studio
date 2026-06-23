import type { Design, PriceRequest, User } from "@prisma/client";

export type ShopPriceRequestRow = PriceRequest & {
  customer: Pick<User, "id" | "name" | "phone">;
  design: Pick<Design, "id" | "title" | "imagePath"> | null;
};
