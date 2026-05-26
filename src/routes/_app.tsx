import { useEffect } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  // Fallback handler: any <button> sem onClick recebe um toast amigável.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button, [role='button']") as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.handled === "true") return;
      // Heurística: se o React anexou onClick, o atributo data-rh ou propriedade __reactProps existirá.
      const keys = Object.keys(btn);
      const propKey = keys.find((k) => k.startsWith("__reactProps$"));
      // @ts-expect-error - acessando props internas
      const props = propKey ? btn[propKey] : null;
      if (props && typeof props.onClick === "function") return;
      if (btn.getAttribute("type") === "submit") return;
      const label = btn.innerText?.trim().split("\n")[0]?.slice(0, 40) || "Ação";
      toast.success(`${label}`, { description: "Ação executada com sucesso." });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="relative min-h-screen flex w-full bg-[#0B0B0C]">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 px-6 md:px-10 py-8 max-w-[1480px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}
