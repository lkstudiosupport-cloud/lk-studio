import type { Design, Measurement, Order, OrderFavorite, OrderImage, Person, ServiceCategory, User } from "@prisma/client";

type DesignPreview = Pick<Design, "id" | "title" | "imagePath" | "category">;

export type ShopOrderData = Order & {
  customer: Pick<User, "id" | "name" | "phone">;
  person: (Person & { measurements: Measurement[] }) | null;
  design: DesignPreview | null;
  images: OrderImage[];
  orderFavorites: (OrderFavorite & {
    design: DesignPreview;
  })[];
};

export type ShopOrderDesignItem = {
  design: DesignPreview;
  category: ServiceCategory;
};
