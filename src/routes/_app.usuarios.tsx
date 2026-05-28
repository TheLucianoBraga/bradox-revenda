import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Edit3, Mail, Network, Phone, Plus, Search, ShieldCheck, Store, Trash2, Users, X } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ModalPortal } from "@/components/ModalPortal";
import { useAppSession } from "@/contexts/AppSessionContext";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import {
  approveReseller,
  deleteManagedUser,
  fetchCustomerPlanPrices,
  fetchUsersSnapshot,
  saveCustomerPlanPrices,
  saveManagedUser,
  type CustomerPlanPriceRow,
  type CustomerDirectoryRow,
  type CustomerPlanAssignmentInput,
  type ManagedUserRole,
  type ResellerDirectoryRow,
} from "@/services/bradox/users";
import { fetchPlans, fetchServers, type PlanRow, type ServerRow } from "@/services/bradox/catalog";

export const Route = createFileRoute("/_app/usuarios")({ component: Usuarios });

type Tab = "clientes" | "revendas";
type DirectoryRow = CustomerDirectoryRow | ResellerDirectoryRow;
type UserModalState = { mode: "create" | "edit"; role: ManagedUserRole; item?: DirectoryRow } | null;
type DeleteState = { item: DirectoryRow; role: ManagedUserRole } | null;
type CustomerPlanDraft = { key: string; planId: string; serverId: string; customPrice: string; status: string };

function Usuarios() {
  const { activeNetworkId } = useAppSession();
  const [tab, setTab] = useState<Tab>("clientes");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerDirectoryRow[]>([]);
  const [resellers, setResellers] = useState<ResellerDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [userModal, setUserModal] = useState<UserModalState>(null);
  const [toDelete, setToDelete] = useState<DeleteState>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await fetchUsersSnapshot(activeNetworkId);
      setCustomers(snapshot.customers);
      setResellers(snapshot.resellers);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [activeNetworkId]);

  const filteredCustomers = useMemo(() => filterRows(customers, query), [customers, query]);
  const filteredResellers = useMemo(() => filterRows(resellers, query), [resellers, query]);

  const onApprove = async (profileId: string) => {
    setApprovingId(profileId);
    try {
      await approveReseller(profileId);
      toast.success("Revenda aprovada e rede criada");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel aprovar a revenda");
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteManagedUser(toDelete.item.id);
      toast.success(toDelete.role === "cliente" ? "Cliente excluido" : "Revenda excluida");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir usuario");
    }
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Clientes migrados e revendas cadastradas, com aprovacao criando a rede informada no cadastro."
        actions={
          <div className="flex flex-wrap gap-2">
            <NeonButton variant="secondary" onClick={() => setUserModal({ mode: "create", role: "cliente" })}>
              <Plus className="h-4 w-4" /> Novo cliente
            </NeonButton>
            <NeonButton onClick={() => setUserModal({ mode: "create", role: "revenda" })}>
              <Plus className="h-4 w-4" /> Nova revenda
            </NeonButton>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-1">
          <TabButton active={tab === "clientes"} onClick={() => setTab("clientes")} icon={Users} label="Clientes" count={customers.length} />
          <TabButton active={tab === "revendas"} onClick={() => setTab("revendas")} icon={Store} label="Revendas" count={resellers.length} />
        </div>
        <div className="relative w-full max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, email, telefone ou rede"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
      </div>

      {loading ? (
        <GlassCard className="p-10 text-center text-sm text-slate-400">Carregando usuarios...</GlassCard>
      ) : tab === "clientes" ? (
        <UsersGrid
          rows={filteredCustomers}
          empty="Nenhum cliente encontrado."
          onEdit={(item) => setUserModal({ mode: "edit", role: "cliente", item })}
          onDelete={(item) => setToDelete({ role: "cliente", item })}
        />
      ) : (
        <ResellersGrid
          rows={filteredResellers}
          approvingId={approvingId}
          onApprove={onApprove}
          onEdit={(item) => setUserModal({ mode: "edit", role: "revenda", item })}
          onDelete={(item) => setToDelete({ role: "revenda", item })}
        />
      )}

      <UserModal
        state={userModal}
        onClose={() => setUserModal(null)}
        onSaved={async () => {
          setUserModal(null);
          await loadUsers();
        }}
      />
      <ConfirmModal
        open={!!toDelete}
        title={toDelete?.role === "cliente" ? "Excluir cliente" : "Excluir revenda"}
        description={`Tem certeza que deseja excluir "${toDelete?.item.full_name}"? O usuario sera inativado e nao podera acessar o sistema.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function filterRows<T extends { full_name: string; email: string | null; phone: string | null; network_name?: string | null; requested_network_name?: string | null }>(rows: T[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => [row.full_name, row.email, row.phone, row.network_name, row.requested_network_name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term)));
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Users; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm transition flex items-center justify-center gap-2 ${active ? "bg-amber-400 text-black" : "text-slate-300 hover:bg-white/5"}`}
    >
      <Icon className="h-4 w-4" /> {label} <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}

function UsersGrid({ rows, empty, onEdit, onDelete }: { rows: CustomerDirectoryRow[]; empty: string; onEdit: (item: CustomerDirectoryRow) => void; onDelete: (item: CustomerDirectoryRow) => void }) {
  if (rows.length === 0) return <GlassCard className="p-10 text-center text-sm text-slate-400">{empty}</GlassCard>;

  return (
    <div className="grid grid-cols-12 gap-4">
      {rows.map((row) => (
        <UserCard key={row.id} title={row.full_name} email={row.email} phone={row.phone} networkName={row.network_name} status={row.status} onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
      ))}
    </div>
  );
}

function ResellersGrid({ rows, approvingId, onApprove, onEdit, onDelete }: { rows: ResellerDirectoryRow[]; approvingId: string | null; onApprove: (profileId: string) => void; onEdit: (item: ResellerDirectoryRow) => void; onDelete: (item: ResellerDirectoryRow) => void }) {
  if (rows.length === 0) return <GlassCard className="p-10 text-center text-sm text-slate-400">Nenhuma revenda cadastrada.</GlassCard>;

  return (
    <div className="grid grid-cols-12 gap-4">
      {rows.map((row) => (
        <UserCard
          key={row.id}
          title={row.full_name}
          email={row.email}
          phone={row.phone}
          networkName={row.network_name ?? row.requested_network_name}
          requestedNetworkName={row.requested_network_name}
          status={row.status}
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
          action={row.status !== "active" ? (
            <NeonButton onClick={() => onApprove(row.id)} disabled={approvingId === row.id}>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Aprovar</span>
            </NeonButton>
          ) : null}
        />
      ))}
    </div>
  );
}

function UserCard({ title, email, phone, networkName, requestedNetworkName, status, action, onEdit, onDelete }: {
  title: string;
  email: string | null;
  phone: string | null;
  networkName?: string | null;
  requestedNetworkName?: string | null;
  status: string;
  action?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const active = status === "active";
  return (
    <GlassCard className="col-span-12 lg:col-span-6 xl:col-span-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-11 w-11 rounded-xl bg-amber-400/10 border border-amber-300/20 grid place-items-center shrink-0">
          {active ? <ShieldCheck className="h-5 w-5 text-amber-300" /> : <Clock3 className="h-5 w-5 text-slate-300" />}
        </div>
        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${active ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
          {active ? "Ativo" : "Pendente"}
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <div className="font-display text-lg text-white truncate">{title}</div>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {email && <div className="flex items-center gap-2 min-w-0"><Mail className="h-4 w-4 text-amber-300 shrink-0" /><span className="truncate">{email}</span></div>}
          {phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-300" />{phone}</div>}
          {networkName && <div className="flex items-center gap-2 min-w-0"><Network className="h-4 w-4 text-amber-300 shrink-0" /><span className="truncate">{networkName}</span></div>}
          {requestedNetworkName && !active && <div className="text-xs text-slate-500">Rede solicitada: {requestedNetworkName}</div>}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
      <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-4">
        <button onClick={onEdit} className={iconActionClass} title="Editar usuario">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className={iconDangerClass} title="Excluir usuario">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}

function UserModal({ state, onClose, onSaved }: { state: UserModalState; onClose: () => void; onSaved: () => Promise<void> }) {
  const { activeNetworkId } = useAppSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [networkName, setNetworkName] = useState("");
  const [password, setPassword] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [planDrafts, setPlanDrafts] = useState<CustomerPlanDraft[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return;
    setFullName(state.item?.full_name ?? "");
    setEmail(state.item?.email ?? "");
    setPhone(state.item?.phone ?? "");
    setStatus(state.item?.status ?? "active");
    setNetworkName(getRowNetworkName(state.item) ?? "");
    setPassword("");
    setPlanDrafts([]);
  }, [state]);

  useEffect(() => {
    if (!state || state.role !== "cliente") return;

    let active = true;
    const networkId = getRowNetworkId(state.item) ?? activeNetworkId;
    setPlansLoading(true);

    Promise.all([
      fetchPlans(networkId),
      fetchServers(networkId),
      fetchCustomerPlanPrices(state.item?.id),
    ])
      .then(([loadedPlans, loadedServers, customerPlans]) => {
        if (!active) return;
        setPlans(loadedPlans.filter((plan) => plan.status !== "inactive"));
        setServers(loadedServers.filter((server) => server.status !== "inactive"));
        setPlanDrafts(customerPlans.map(toPlanDraft));
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Falha ao carregar planos do cliente");
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });

    return () => { active = false; };
  }, [state, activeNetworkId]);

  if (!state) return null;

  const isCreate = state.mode === "create";
  const isReseller = state.role === "revenda";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe o nome");
      return;
    }
    if (!email.trim()) {
      toast.error("Informe o e-mail");
      return;
    }
    if (isCreate && password.length < 8) {
      toast.error("Informe uma senha temporaria com pelo menos 8 caracteres");
      return;
    }
    if (isReseller && status === "active" && !networkName.trim()) {
      toast.error("Informe o nome da rede da revenda");
      return;
    }

    setSaving(true);
    try {
      const savedProfile = await saveManagedUser({
        id: state.item?.id ?? null,
        role: state.role,
        email,
        fullName,
        phone,
        status,
        networkId: getRowNetworkId(state.item) ?? activeNetworkId,
        networkName: isReseller ? networkName : null,
        password: password || null,
      });
      if (!isReseller) {
        await saveCustomerPlanPrices(savedProfile.id, normalizePlanDrafts(planDrafts, plans));
      }
      toast.success(isCreate ? "Usuario criado" : "Usuario atualizado");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1115] p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-white">{isCreate ? "Novo" : "Editar"} {isReseller ? "revenda" : "cliente"}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} placeholder="Nome completo" autoFocus />
            </Field>
            <Field label="E-mail">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="email@exemplo.com" />
            </Field>
            <Field label="WhatsApp">
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} placeholder="11999999999" />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                <option value="active">Ativo</option>
                <option value="pending_approval">Pendente</option>
              </select>
            </Field>
            {isReseller && (
              <Field label="Nome da rede">
                <input value={networkName} onChange={(event) => setNetworkName(event.target.value)} className={inputClass} placeholder="Nome da rede" />
              </Field>
            )}
            <Field label={isCreate ? "Senha temporaria" : "Nova senha opcional"}>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder={isCreate ? "Minimo 8 caracteres" : "Deixe vazio para manter"} />
            </Field>
          </div>

          {!isReseller && (
            <CustomerPlanEditor
              drafts={planDrafts}
              plans={plans}
              servers={servers}
              loading={plansLoading}
              onChange={setPlanDrafts}
            />
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}

function CustomerPlanEditor({ drafts, plans, servers, loading, onChange }: {
  drafts: CustomerPlanDraft[];
  plans: PlanRow[];
  servers: ServerRow[];
  loading: boolean;
  onChange: React.Dispatch<React.SetStateAction<CustomerPlanDraft[]>>;
}) {
  const addPlan = () => {
    const firstPlan = plans.find((plan) => !drafts.some((draft) => draft.planId === plan.id));
    if (!firstPlan) {
      toast.error(plans.length === 0 ? "Nenhum plano ativo para esta rede" : "Todos os planos ativos ja foram adicionados");
      return;
    }

    onChange((current) => [...current, {
      key: crypto.randomUUID(),
      planId: firstPlan.id,
      serverId: firstPlan.server_id ?? "",
      customPrice: "",
      status: "active",
    }]);
  };

  const updateDraft = (key: string, patch: Partial<CustomerPlanDraft>) => {
    onChange((current) => current.map((draft) => {
      if (draft.key !== key) return draft;
      const nextDraft = { ...draft, ...patch };
      if (patch.planId) {
        const selectedPlan = plans.find((plan) => plan.id === patch.planId);
        nextDraft.serverId = selectedPlan?.server_id ?? nextDraft.serverId;
      }
      return nextDraft;
    }));
  };

  const removeDraft = (key: string) => {
    onChange((current) => current.filter((draft) => draft.key !== key));
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-white">Planos e valores deste cliente</div>
          <div className="text-xs text-slate-500">Escolha servidor, plano e um valor especial quando este cliente tiver desconto.</div>
        </div>
        <button type="button" onClick={addPlan} className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:border-amber-200/60">
          Adicionar plano
        </button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">Carregando catalogo...</div>
      ) : drafts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">Nenhum plano especifico definido. O cliente segue os valores da tabela.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {drafts.map((draft) => {
            const selectedPlan = plans.find((plan) => plan.id === draft.planId);
            const tablePrice = selectedPlan?.price ?? 0;
            const customPrice = parsePriceInput(draft.customPrice);
            const effectivePrice = customPrice ?? tablePrice;
            const discount = Math.max(tablePrice - effectivePrice, 0);

            return (
              <div key={draft.key} className="rounded-xl border border-white/10 bg-[#101317] p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_130px_auto] md:items-end">
                  <Field label="Servidor">
                    <select value={draft.serverId} onChange={(event) => updateDraft(draft.key, { serverId: event.target.value })} className={inputClass}>
                      <option value="">Servidor do plano</option>
                      {servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Plano">
                    <select value={draft.planId} onChange={(event) => updateDraft(draft.key, { planId: event.target.value })} className={inputClass}>
                      {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {formatCurrency(plan.price)}</option>)}
                    </select>
                  </Field>
                  <Field label="Valor especial opcional">
                    <input value={draft.customPrice} onChange={(event) => updateDraft(draft.key, { customPrice: event.target.value })} className={inputClass} inputMode="decimal" placeholder={`Padrao ${formatCurrency(tablePrice)}`} />
                  </Field>
                  <button type="button" onClick={() => removeDraft(draft.key)} className={iconDangerClass} title="Remover plano">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Valor tabelado: {formatCurrency(tablePrice)}</span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-cyan-100">Cliente: {formatCurrency(effectivePrice)}</span>
                  {discount > 0 && <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">Desconto: {formatCurrency(discount)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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

function getRowNetworkName(row?: DirectoryRow) {
  if (!row) return null;
  return "requested_network_name" in row ? row.network_name ?? row.requested_network_name : row.network_name;
}

function getRowNetworkId(row?: DirectoryRow) {
  if (!row) return null;
  return row.network_id ?? null;
}

function toPlanDraft(row: CustomerPlanPriceRow): CustomerPlanDraft {
  return {
    key: row.id,
    planId: row.plan_id,
    serverId: row.server_id ?? "",
    customPrice: row.custom_price == null ? "" : String(row.custom_price).replace(".", ","),
    status: row.status,
  };
}

function normalizePlanDrafts(drafts: CustomerPlanDraft[], plans: PlanRow[]): CustomerPlanAssignmentInput[] {
  const assignments = new Map<string, CustomerPlanAssignmentInput>();

  drafts.forEach((draft) => {
    if (!draft.planId) return;
    const selectedPlan = plans.find((plan) => plan.id === draft.planId);
    const customPrice = parsePriceInput(draft.customPrice);
    assignments.set(draft.planId, {
      planId: draft.planId,
      serverId: draft.serverId || null,
      customPrice: customPrice != null && selectedPlan && customPrice !== Number(selectedPlan.price) ? customPrice : null,
      status: draft.status || "active",
    });
  });

  return Array.from(assignments.values());
}

function parsePriceInput(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#101317] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none";
const iconActionClass = "grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:border-amber-300/40 hover:text-amber-200";
const iconDangerClass = "grid h-8 w-8 place-items-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-200 hover:border-red-300/50";