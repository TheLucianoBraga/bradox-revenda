import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Database, FileText, Network, Package, Server, Users } from "lucide-react";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { fetchDashboardCounts } from "@/services/bradox/dashboard";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Counts = { networks: number; servers: number; plans: number; templates: number };

function Dashboard() {
  const { activeNetwork, activeNetworkId, profile } = useAppSession();
  const canManageUsers = profile?.role === "admin" || profile?.role === "revenda";
  const [counts, setCounts] = useState<Counts>({ networks: 0, servers: 0, plans: 0, templates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDashboardCounts(activeNetworkId, profile?.role)
      .then((nextCounts) => { if (active) setCounts(nextCounts); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeNetworkId, profile?.role]);

  const cards = [
    { label: "Redes", value: counts.networks, icon: Network },
    { label: "Servidores", value: counts.servers, icon: Server },
    { label: "Planos", value: counts.plans, icon: Package },
    { label: "Templates", value: counts.templates, icon: FileText },
  ];

  return (
    <>
      <PageHeader
        title="Central de Controle"
        subtitle={`Resumo real da rede ${activeNetwork?.name ?? "selecionada"} no novo sistema.`}
        actions={canManageUsers ? (
          <Link to="/usuarios" data-handled="true">
            <NeonButton><span className="flex items-center gap-2"><Users className="h-4 w-4" /> Ver usuarios</span></NeonButton>
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-12 gap-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} className="col-span-12 sm:col-span-6 xl:col-span-3 p-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-400/10 border border-amber-300/20 grid place-items-center">
                <Icon className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className="font-display text-2xl text-white">{loading ? "..." : value.toLocaleString("pt-BR")}</div>
              </div>
            </div>
          </GlassCard>
        ))}

        <GlassCard className="col-span-12 p-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
              <Database className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <div className="font-display text-xl text-white">Dados reais conectados</div>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Os numeros desta tela vêm do banco isolado bradox_revenda. Quando novas areas forem conectadas a tabelas reais, elas entram neste resumo sem dados demonstrativos.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
