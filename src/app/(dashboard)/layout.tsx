import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold text-white">Agentboard</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLink href="/boards" label="Boards" icon="▦" />
          <NavLink href="/tasks" label="All Tasks" icon="☰" />
          <div className="my-4 border-t border-slate-800" />
          <NavLink href="/settings" label="Settings" icon="⚙" />
          <NavLink href="/settings/tokens" label="API Tokens" icon="🔑" />
          <NavLink href="/settings/integrations" label="Integrations" icon="🔗" />
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-slate-300"
                title="Sign out"
              >
                ↗
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}
