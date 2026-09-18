import { redirect } from "next/navigation";

/** Designs moved to the LK Designs app — keep old links working. */
export default async function ShopDesignsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; part?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.size) q.set("size", params.size);
  if (params.part) q.set("part", params.part);
  const qs = q.toString();
  redirect(qs ? `/designs/shop?${qs}` : "/designs/shop");
}
