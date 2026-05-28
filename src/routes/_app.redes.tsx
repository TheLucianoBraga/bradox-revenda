import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { fetchCatalogSnapshot, type CustomerDirectoryRow, type NetworkRow, type PlanRow, type ServerRow } from "@/services/bradox/catalog";
import { Network, Server, Package, Store, ArrowUpRight, Search } from "lucide-react";

export const Route = createFileRoute("/_app/redes")({ component: Redes });

type NetworkSummary = NetworkRow & {
  servers: ServerRow[];
  plans: PlanRow[];
  customers: CustomerDirectoryRow[];
};

function Redes() {
  const { activeNetworkId } = useAppSession();
  const [items, setItems] = useState<NetworkSummary[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    fetchCatalogSnapshot(activeNetworkId)
      .then(({ networks, servers, plans, customers }) => {
        if (!active) return;
        setItems(networks.map((network) => ({
          ...network,
          servers: servers.filter((server) => server.network_id === network.id),
          plans: plans.filter((plan) => plan.network_id === network.id),
          customers: customers.filter((customer) => customer.network_id === network.id),
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [activeNetworkId]);

  const filtered = useMemo(
    () => items.filter((network) =>
      network.name.toLowerCase().includes(q.toLowerCase()) ||
      (network.slug ?? "").toLowerCase().includes(q.toLowerCase()),
    ),
    [items, q],
  );

  return (
    <>
      <PageHeader
        title="Redes"
        subtitle="Separe a operação por rede e confira clientes, servidores e planos vinculados a cada escopo."
        actions={
          <Link to="/usuarios" data-handled="true">
            <NeonButton>
              <span className="flex items-center gap-2">Ver clientes <ArrowUpRight className="h-4 w-4" /></span>
            </NeonButton>
          </Link>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar rede ou slug"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <div className="text-xs text-slate-400">{filtered.length} de {items.length}</div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {filtered.map((network) => (
          <GlassCard key={network.id} className="col-span-12 lg:col-span-6 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400/25 to-yellow-500/20 border border-white/10 grid place-items-center">
                  <Network className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-display text-lg text-white">{network.name}</div>
                  <div className="text-[11px] uppercase tracking-widest text-white/40">{network.slug ?? network.id.slice(0, 8)}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-200">
                {network.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              <Metric icon={Store} label="Clientes" value={network.customers.length} />
              <Metric icon={Server} label="Servidores" value={network.servers.length} />
              <Metric icon={Package} label="Planos" value={network.plans.length} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {network.customers.slice(0, 4).map((customer) => (
                <span key={customer.id} className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300">
                  {customer.full_name}
                </span>
              ))}
              {network.customers.length === 0 && <span className="text-xs text-slate-500">Sem clientes migrados nesta rede</span>}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="text-white/50 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</div>
      <div className="text-white text-lg font-display mt-0.5">{value}</div>
    </div>
  );
}