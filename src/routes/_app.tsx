import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Topbar } from "@/components/Topbar";
import { PwaAutoUpdater } from "@/components/PwaAutoUpdater";
import { InAppBrowserTabs } from "@/components/InAppBrowserTabs";
import { AppSessionProvider, useAppSession } from "@/contexts/AppSessionContext";
import { canAccessPanel, canAccessPath } from "@/services/bradox/acl";
import { supabase } from "@/integrations/supabase/client";

import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppSessionProvider>
      <AuthenticatedAppShell />
    </AppSessionProvider>
  );
}

function AuthenticatedAppShell() {
  const navigate = useNavigate();
  const { loading, profile, error } = useAppSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!loading && !profile) {
      void navigate({ to: "/login", replace: true });
    }
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (loading || !profile) return;
    if (!canAccessPanel(profile.role)) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (!canAccessPath(profile.role, pathname)) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, navigate, pathname, profile]);

  if (loading) {
    return (
      <div className="relative min-h-screen grid place-items-center app-bg px-6 text-center">
        <div className="app-ambient" />
        <div className="app-grain" />
        <div className="relative z-10 glass-strong rounded-3xl border border-white/10 px-8 py-6">
          <img src="/bradox-play-logo.png" alt="Bradox Play" className="mx-auto h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(214,168,79,0.28)]" />
          <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Bradox Play</div>
          <div className="mt-2 font-display text-2xl text-white">Carregando sessao</div>
          <div className="mt-2 text-sm text-slate-400">Validando seu acesso antes de abrir o painel.</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="relative min-h-screen grid place-items-center app-bg px-6 text-center">
        <div className="app-ambient" />
        <div className="app-grain" />
        <div className="relative z-10 glass-strong max-w-md rounded-3xl border border-red-400/20 px-8 py-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-red-200/80">Sessao indisponivel</div>
          <div className="mt-2 font-display text-2xl text-white">Nao foi possivel carregar seu acesso</div>
          <div className="mt-2 text-sm text-slate-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
      <div className="relative min-h-screen flex w-full app-bg">
        <PwaAutoUpdater />
        {/* Deep ambient gradient: charcoal w/ faint blue-violet wash */}
        <div className="app-ambient" />
        <div className="app-grain" />

        <Sidebar />
        <div className="relative z-10 flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 px-6 md:px-10 py-10 pb-24 lg:pb-10 max-w-[1480px] w-full mx-auto animate-fade-up">
            <Outlet />
          </main>
        </div>
        <BottomNavigation />
        <InAppBrowserTabs />
        <Toaster position="top-right" theme="dark" />
      </div>
  );
}
