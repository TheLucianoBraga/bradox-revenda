import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Database, FileText, Link2, Network, Package, Server, Users, Wrench } from "lucide-react";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { fetchDashboardCounts } from "@/services/bradox/dashboard";
import { fetchUsefulLinks, type UsefulLinkRow } from "@/services/bradox/tools";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Counts = { networks: number; servers: number; plans: number; templates: number };

function Dashboard() {
  const { activeNetwork, activeNetworkId, profile } = useAppSession();
  const canManageUsers = profile?.role === "admin" || profile?.role === "revenda";
  const isClient = profile?.role === "cliente";
  const [counts, setCounts] = useState<Counts>({ networks: 0, servers: 0, plans: 0, templates: 0 });
  const [tools, setTools] = useState<UsefulLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDashboardCounts(activeNetworkId, profile?.role)
      .then((nextCounts) => { if (active) setCounts(nextCounts); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeNetworkId, profile?.role]);

  useEffect(() => {
    let active = true;
    if (!isClient || !activeNetworkId) {
      setTools([]);
      return () => { active = false; };
    }

    setToolsLoading(true);
    fetchUsefulLinks(activeNetworkId)
      .then((links) => { if (active) setTools(links); })
      .catch(() => { if (active) setTools([]); })
      .finally(() => { if (active) setToolsLoading(false); });

    return () => { active = false; };
  }, [activeNetworkId, isClient]);

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

        {isClient && (
          <GlassCard className="col-span-12 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                  <Wrench className="h-3.5 w-3.5" /> Ferramentas
                </div>
                <div className="mt-2 font-display text-xl text-white">Acessos da sua rede</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                {toolsLoading ? "Carregando" : `${tools.length} links`}
              </div>
            </div>

            {tools.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {tools.slice(0, 9).map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-pwa-browser="true"
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-amber-300/35 hover:bg-white/[0.06]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-amber-400/10 text-amber-200">
                      {tool.image_url ? <img src={tool.image_url} alt="" className="h-full w-full object-cover" /> : <Link2 className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{tool.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{tool.url}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-amber-200" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                {toolsLoading ? "Carregando ferramentas..." : "Nenhuma ferramenta cadastrada para esta rede."}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </>
  );
}
