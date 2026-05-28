import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAppSession } from "@/contexts/AppSessionContext";
import { getBottomNavItems, type AppRole } from "@/components/Sidebar";

export function BottomNavigation() {
  const { profile } = useAppSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const role = (profile?.role ?? "cliente") as AppRole;

  const items = useMemo(() => getBottomNavItems(role), [role]);
  if (items.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0f1115]/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid h-16 max-w-5xl px-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-semibold transition ${active ? "text-amber-200" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}