import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { SessionRefresh } from "@/components/SessionRefresh";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);
  if (!session) redirect("/login/admin");

  return (
    <div className="brand-page-bg min-h-dvh">
      <SessionRefresh />
      <header className="border-b border-brand-green/10 bg-white/90 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">Admin</p>
            <p className="font-bold text-brand-green">{session.name}</p>
          </div>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/admin/designs" className="text-brand-green underline">
              Catalog
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-zinc-600 hover:text-red-600">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
