import { redirect } from "next/navigation";

/** Old /login?role=… links — send to dedicated pages or home. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  if (sp?.role === "SHOP") redirect("/login/shop");
  if (sp?.role === "CUSTOMER") redirect("/login/customer");
  redirect("/");
}
