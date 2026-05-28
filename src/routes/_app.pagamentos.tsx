import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, ReceiptText, X } from "lucide-react";
import { ModalPortal } from "@/components/ModalPortal";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { fetchCatalogSnapshot, type CustomerDirectoryRow, type PlanRow } from "@/services/bradox/catalog";
import { createCustomerInvoice, fetchOrders, type OrderRow } from "@/services/bradox/payments";

export const Route = createFileRoute("/_app/pagamentos")({ component: Pagamentos });

function Pagamentos() {
  const { activeNetworkId, profile } = useAppSession();
  const isCliente = profile?.role === "cliente";
  const buyerFilter = isCliente ? profile?.id : undefined;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders(activeNetworkId, buyerFilter);
      setOrders(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar cobrancas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchOrders(activeNetworkId, buyerFilter)
      .then((data) => { if (active) setOrders(data); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeNetworkId, buyerFilter]);

  return (
    <>
      <PageHeader
        title="Pagamentos"
        subtitle="Toda cobranca abre uma fatura interna do Bradox. O cliente paga sem sair para checkout externo."
        actions={!isCliente ? (
          <NeonButton onClick={() => setInvoiceModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova cobranca
          </NeonButton>
        ) : undefined}
      />

      <GlassCard className="overflow-hidden" interactive={false}>
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando cobrancas...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Nenhuma cobranca registrada.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <a key={order.id} href={`/fatura/${order.id}`} target="_blank" rel="noreferrer" className="grid gap-4 p-5 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-white">Fatura #{order.id.slice(0, 8)}</div>
                    <div className="mt-1 text-xs text-slate-400">{order.order_type} · {formatDate(order.created_at)}</div>
                  </div>
                </div>
                <Status value={order.status} />
                <div className="flex items-center justify-between gap-3 text-right">
                  <div className="text-lg font-semibold text-cyan-200">{formatMoney(Number(order.amount))}</div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </a>
            ))}
          </div>
        )}
      </GlassCard>

      {!isCliente ? (
        <InvoiceModal
          open={invoiceModalOpen}
          networkId={activeNetworkId}
          onClose={() => setInvoiceModalOpen(false)}
          onCreated={async (order) => {
            setInvoiceModalOpen(false);
            await loadOrders();
            window.open(`/fatura/${order.id}`, "_blank", "noopener,noreferrer");
          }}
        />
      ) : null}
    </>
  );
}

function InvoiceModal({ open, networkId, onClose, onCreated }: { open: boolean; networkId?: string | null; onClose: () => void; onCreated: (order: OrderRow) => Promise<void> }) {
  const [customers, setCustomers] = useState<CustomerDirectoryRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetchCatalogSnapshot(networkId)
      .then((snapshot) => {
        if (!active) return;
        const activeCustomers = snapshot.customers.filter((customer) => customer.status !== "inactive");
        const activePlans = snapshot.plans.filter((plan) => plan.status !== "inactive");
        setCustomers(activeCustomers);
        setPlans(activePlans);
        setCustomerId(activeCustomers[0]?.id ?? "");
        setPlanId(activePlans[0]?.id ?? "");
        setDueDate(defaultDueDate());
        setNotes("");
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "Falha ao carregar clientes e planos");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open, networkId]);

  if (!open) return null;

  const selectedPlan = plans.find((plan) => plan.id === planId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerId || !planId) {
      toast.error("Selecione cliente e plano");
      return;
    }
    setSaving(true);
    try {
      const order = await createCustomerInvoice({ customerId, planId, dueDate, notes });
      toast.success("Fatura criada");
      await onCreated(order);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a cobranca");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal open={open} onClose={onClose}>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1115] p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-white">Nova cobranca</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">Carregando clientes e planos...</div>
          ) : (
            <div className="mt-5 grid gap-4">
              <Field label="Cliente">
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={inputClass}>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}
                </select>
              </Field>
              <Field label="Plano">
                <select value={planId} onChange={(event) => setPlanId(event.target.value)} className={inputClass}>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {formatMoney(Number(plan.price))}</option>)}
                </select>
              </Field>
              <Field label="Vencimento">
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Observacao">
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} min-h-24 resize-none`} placeholder="Opcional" />
              </Field>
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                Valor tabelado: {formatMoney(Number(selectedPlan?.price ?? 0))}. Se o cliente tiver valor especial neste plano, a fatura sera criada com o desconto salvo no cadastro dele.
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30">Cancelar</button>
            <button type="submit" disabled={saving || loading || !customerId || !planId} className="rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
              {saving ? "Criando..." : "Criar fatura"}
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

function Status({ value }: { value: string }) {
  const label: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Aguardando pagamento",
    awaiting_manual_review: "Comprovante em analise",
    paid: "Pago",
    expired: "Expirada",
    cancelled: "Cancelada",
  };
  return <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{label[value] || value}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#101317] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none";
