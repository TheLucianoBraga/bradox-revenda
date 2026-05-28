import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Edit3, Package, Plus, Search, Server, Trash2, X } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ModalPortal } from "@/components/ModalPortal";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { deletePlan, fetchPlans, fetchServers, savePlan, type PlanRow, type ServerRow } from "@/services/bradox/catalog";
import { createSelfPlanInvoice } from "@/services/bradox/payments";

export const Route = createFileRoute("/_app/planos")({ component: Planos });

type PlanModalState = { mode: "create" | "edit"; item?: PlanRow } | null;

function Planos() {
  const { activeNetworkId, profile } = useAppSession();
  const canManagePlans = profile?.role === "admin" || profile?.role === "revenda";
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<PlanModalState>(null);
  const [toDelete, setToDelete] = useState<PlanRow | null>(null);
  const [contractingPlanId, setContractingPlanId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedPlans, loadedServers] = await Promise.all([fetchPlans(activeNetworkId), fetchServers(activeNetworkId)]);
      setPlans(loadedPlans.filter((plan) => plan.status !== "inactive"));
      setServers(loadedServers.filter((server) => server.status !== "inactive"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeNetworkId]);

  const serverById = useMemo(() => new Map(servers.map((server) => [server.id, server])), [servers]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) => [plan.name, plan.plan_type, serverById.get(plan.server_id ?? "")?.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)));
  }, [plans, query, serverById]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deletePlan(toDelete.id);
      setPlans((current) => current.filter((plan) => plan.id !== toDelete.id));
      toast.success("Plano inativado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel inativar plano");
    }
  };

  const contractPlan = async (plan: PlanRow) => {
    setContractingPlanId(plan.id);
    try {
      const order = await createSelfPlanInvoice({ planId: plan.id });
      toast.success("Fatura do plano criada");
      window.open(`/fatura/${order.id}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel contratar este plano");
    } finally {
      setContractingPlanId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Planos"
        subtitle="Crie planos reais com preco, duracao, creditos, servidor e status por rede."
        actions={canManagePlans ? (
          <NeonButton onClick={() => setModal({ mode: "create" })}>
            <Plus className="h-4 w-4" /> Novo plano
          </NeonButton>
        ) : undefined}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar plano, tipo ou servidor"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">{filtered.length} de {plans.length} planos</div>
      </div>

      {loading ? (
        <GlassCard className="p-10 text-center text-sm text-slate-400">Carregando planos...</GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-slate-400">Nenhum plano encontrado.</GlassCard>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {filtered.map((plan, index) => {
            const server = serverById.get(plan.server_id ?? "");
            return (
              <GlassCard key={plan.id} className={`relative col-span-12 overflow-hidden p-6 md:col-span-6 xl:col-span-3 ${index === 0 ? "border border-cyan-400/40 glow-cyan" : ""}`}>
                {index === 0 && <div className="absolute right-3 top-3 text-[10px] uppercase tracking-widest text-cyan-300">Menor valor</div>}
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/30 to-amber-500/20">
                  <Package className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="mt-4 min-w-0">
                  <div className="font-display text-xl text-white truncate">{plan.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{plan.duration_days} dias · {plan.plan_type}</div>
                </div>
                <div className="mt-4 font-display text-3xl text-gradient">{formatMoney(Number(plan.price))}<span className="ml-1 font-sans text-xs text-slate-500">/periodo</span></div>
                <ul className="mt-5 space-y-2 text-sm">
                  <Benefit>{plan.credits > 0 ? `${plan.credits} creditos inclusos` : "Sem credito vinculado"}</Benefit>
                  <Benefit>{server ? `Servidor ${server.name}` : "Sem servidor fixo"}</Benefit>
                  <Benefit>Status {statusLabel(plan.status)}</Benefit>
                </ul>
                <div className="mt-6 flex gap-2">
                  {canManagePlans ? (
                    <>
                      <button onClick={() => setModal({ mode: "edit", item: plan })} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-200 hover:border-cyan-400/40">
                        <span className="inline-flex items-center justify-center gap-2"><Edit3 className="h-3.5 w-3.5" /> Editar</span>
                      </button>
                      <button onClick={() => setToDelete(plan)} className="grid h-9 w-9 place-items-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-200 hover:border-red-300/50" title="Inativar plano">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => void contractPlan(plan)}
                      disabled={contractingPlanId === plan.id}
                      className="w-full rounded-xl border border-cyan-300/30 bg-cyan-300/10 py-2 text-center text-xs font-semibold text-cyan-100 hover:border-cyan-200/60 disabled:opacity-60"
                    >
                      {contractingPlanId === plan.id ? "Gerando fatura..." : "Contratar este plano"}
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {canManagePlans ? (
        <>
          <PlanModal
            state={modal}
            networkId={activeNetworkId}
            servers={servers}
            onClose={() => setModal(null)}
            onSaved={async () => {
              setModal(null);
              await loadData();
            }}
          />
          <ConfirmModal
            open={!!toDelete}
            title="Inativar plano"
            description={toDelete ? `Tem certeza que deseja inativar "${toDelete.name}"? Faturas existentes continuam preservadas.` : ""}
            confirmLabel="Inativar"
            onConfirm={confirmDelete}
            onClose={() => setToDelete(null)}
          />
        </>
      ) : null}
    </>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-slate-300">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /> {children}
    </li>
  );
}

function PlanModal({ state, networkId, servers, onClose, onSaved }: {
  state: PlanModalState;
  networkId?: string | null;
  servers: ServerRow[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [serverId, setServerId] = useState("");
  const [planType, setPlanType] = useState("cliente");
  const [price, setPrice] = useState("0");
  const [credits, setCredits] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return;
    setName(state.item?.name ?? "");
    setServerId(state.item?.server_id ?? "");
    setPlanType(state.item?.plan_type ?? "cliente");
    setPrice(String(state.item?.price ?? 0).replace(".", ","));
    setCredits(state.item?.credits ?? 0);
    setDurationDays(state.item?.duration_days ?? 30);
    setStatus(state.item?.status ?? "active");
  }, [state]);

  if (!state) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do plano");
      return;
    }

    setSaving(true);
    try {
      await savePlan({
        id: state.item?.id ?? null,
        networkId,
        serverId: serverId || null,
        name,
        planType,
        price: parsePrice(price),
        credits: Number(credits) || 0,
        durationDays: Number(durationDays) || 30,
        status,
      });
      toast.success(state.mode === "create" ? "Plano criado" : "Plano atualizado");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar plano");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1115] p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-white">{state.mode === "create" ? "Novo plano" : "Editar plano"}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Ex.: Mensal 1 tela" autoFocus />
            </Field>
            <Field label="Servidor">
              <select value={serverId} onChange={(event) => setServerId(event.target.value)} className={inputClass}>
                <option value="">Sem servidor fixo</option>
                {servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={planType} onChange={(event) => setPlanType(event.target.value)} className={inputClass}>
                <option value="cliente">Cliente</option>
                <option value="revenda">Revenda</option>
                <option value="teste">Teste</option>
                <option value="credito">Credito</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                <option value="active">Ativo</option>
                <option value="attention">Atencao</option>
                <option value="inactive">Inativo</option>
              </select>
            </Field>
            <Field label="Preco tabelado">
              <input value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
            </Field>
            <Field label="Duracao em dias">
              <input type="number" min={1} value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className={inputClass} />
            </Field>
            <Field label="Creditos inclusos">
              <input type="number" min={0} value={credits} onChange={(event) => setCredits(Number(event.target.value))} className={inputClass} />
            </Field>
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100 md:self-end">
              Valor da tabela: {formatMoney(parsePrice(price))}. Descontos individuais continuam no cadastro do cliente.
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function statusLabel(value: string) {
  const labels: Record<string, string> = { active: "ativo", attention: "atencao", inactive: "inativo" };
  return labels[value] ?? value;
}

function parsePrice(value: string) {
  const parsed = Number(value.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#101317] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none";
