import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Minus, Package, Plus, Search, Server, Zap } from "lucide-react";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import { useAppSession } from "@/contexts/AppSessionContext";
import { fetchServers, type ServerRow } from "@/services/bradox/catalog";
import { createCreditInvoice } from "@/services/bradox/payments";

export const Route = createFileRoute("/_app/creditos")({ component: Creditos });

type ServerFilter = "todos" | "prepaid" | "postpaid";

const quickAmounts = [15, 50, 100, 250, 500];

function Creditos() {
  const { activeNetworkId } = useAppSession();
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverFilter, setServerFilter] = useState<ServerFilter>("todos");
  const [serverSearch, setServerSearch] = useState("");
  const [selectedServerId, setSelectedServerId] = useState("");
  const [panelUsername, setPanelUsername] = useState("");
  const [quantity, setQuantity] = useState(15);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchServers(activeNetworkId)
      .then((rows) => {
        if (!active) return;
        const available = rows.filter((server) => server.status !== "inactive");
        setServers(available);
        if (!selectedServerId && available[0]) {
          setSelectedServerId(available[0].id);
          setQuantity(Math.max(available[0].minimum_credits || 1, 15));
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar servidores"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeNetworkId]);

  const selectedServer = useMemo(() => servers.find((server) => server.id === selectedServerId) ?? null, [servers, selectedServerId]);
  const minimumCredits = Math.max(selectedServer?.minimum_credits || 1, 1);
  const unitPrice = getServerCreditPrice(selectedServer);
  const total = quantity * unitPrice;
  const prepaidCount = servers.filter((server) => server.billing_type === "prepaid").length;
  const postpaidCount = servers.filter((server) => server.billing_type === "postpaid").length;

  const filteredServers = useMemo(() => {
    const term = serverSearch.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesType = serverFilter === "todos" || server.billing_type === serverFilter;
      const matchesSearch = !term || server.name.toLowerCase().includes(term) || (server.base_url ?? "").toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [serverFilter, serverSearch, servers]);

  const selectServer = (server: ServerRow) => {
    setSelectedServerId(server.id);
    setQuantity((current) => Math.max(current, server.minimum_credits || 1));
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((current) => Math.max(minimumCredits, current + delta));
  };

  const createInvoice = async () => {
    if (!activeNetworkId) return toast.error("Selecione uma rede ativa");
    if (!selectedServer) return toast.error("Selecione um servidor");
    if (!panelUsername.trim()) return toast.error("Informe o usuario do painel");
    if (quantity < minimumCredits) return toast.error(`Quantidade minima: ${minimumCredits} creditos`);
    if (unitPrice <= 0) return toast.error("Configure o valor por credito neste servidor");

    setCreating(true);
    try {
      const order = await createCreditInvoice({
        networkId: activeNetworkId,
        serverId: selectedServer.id,
        panelUsername: panelUsername.trim(),
        creditQuantity: quantity,
        notes: notes.trim() || null,
      });
      toast.success("Fatura de creditos criada");
      window.open(`/fatura/${order.id}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar fatura");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader title="Créditos" subtitle="Compre créditos para abastecer o painel externo e acompanhe tudo por fatura." />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-4 lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
              <Package className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <div className="text-sm font-semibold text-cyan-100">Controle financeiro, execução fora do sistema</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">A compra gera fatura e registro financeiro. A inserção dos créditos continua sendo feita no painel do servidor externo.</p>
            </div>
          </div>
        </GlassCard>
        <div className="grid grid-cols-2 gap-4">
          <MiniStat label="Pré-pago" value={prepaidCount} />
          <MiniStat label="Pós-pago" value={postpaidCount} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <GlassCard className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/25 to-cyan-300/15 shadow-lg shadow-amber-950/20">
              <CreditCard className="h-7 w-7 text-amber-200" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-white">Comprar créditos</h2>
              <p className="text-sm text-slate-400">Selecione servidor, quantidade e gere a fatura.</p>
            </div>
          </div>

          <div className="grid gap-5">
            <Field label="Usuário do painel">
              <input value={panelUsername} onChange={(event) => setPanelUsername(event.target.value)} className={inputClass} placeholder="Ex.: cliente123" />
            </Field>

            <Field label="Servidor">
              <select
                value={selectedServerId}
                onChange={(event) => {
                  const server = servers.find((item) => item.id === event.target.value);
                  if (server) selectServer(server);
                }}
                className={inputClass}
              >
                <option value="">Selecione um servidor</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>{server.name} - {formatMoney(getServerCreditPrice(server))}/credito</option>
                ))}
              </select>
            </Field>

            {selectedServer && (
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm md:grid-cols-3">
                <Info label="Tipo" value={selectedServer.billing_type === "prepaid" ? "Pré-pago" : "Pós-pago"} />
                <Info label="Valor por crédito" value={formatMoney(unitPrice)} />
                <Info label="Compra mínima" value={`${minimumCredits} créditos`} />
              </div>
            )}

            <Field label={`Quantidade${selectedServer ? ` (mín. ${minimumCredits})` : ""}`}>
              <div className="grid grid-cols-[48px_1fr_48px] gap-3">
                <button type="button" onClick={() => adjustQuantity(-10)} disabled={quantity <= minimumCredits} className="grid h-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white disabled:opacity-40">
                  <Minus className="h-4 w-4" />
                </button>
                <input type="number" min={minimumCredits} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || minimumCredits)} onBlur={() => setQuantity((current) => Math.max(current, minimumCredits))} className={`${inputClass} text-center font-display text-xl`} />
                <button type="button" onClick={() => adjustQuantity(10)} className="grid h-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Field>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.filter((amount) => amount >= minimumCredits).map((amount) => (
                <button key={amount} type="button" onClick={() => setQuantity(amount)} className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${quantity === amount ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"}`}>
                  {amount} créditos
                </button>
              ))}
            </div>

            <Field label="Observação opcional">
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} min-h-24 resize-none py-3`} placeholder="Ex.: colocar créditos no usuário após confirmação" />
            </Field>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex justify-between text-sm text-slate-300"><span>Quantidade</span><strong className="text-white">{quantity} créditos</strong></div>
              <div className="mt-2 flex justify-between text-sm text-slate-300"><span>Preço unitário</span><strong className="text-white">{formatMoney(unitPrice)}</strong></div>
              <div className="mt-4 flex items-center justify-between border-t border-cyan-200/20 pt-4">
                <span className="font-display text-xl text-white">Total</span>
                <span className="font-display text-3xl text-gradient">{formatMoney(total)}</span>
              </div>
            </div>

            <NeonButton onClick={createInvoice} disabled={creating || loading} className="w-full justify-center">
              <Zap className="h-5 w-5" /> {creating ? "Gerando fatura..." : "Gerar fatura de créditos"}
            </NeonButton>
          </div>
        </GlassCard>

        <div className="min-w-0">
          <div className="mb-4 grid gap-3">
            <div>
              <h2 className="font-display text-xl text-white">Servidores disponíveis</h2>
              <p className="mt-1 text-sm text-slate-400">Filtre por modelo de pagamento e selecione o servidor.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["todos", "Todos"],
                ["prepaid", "Pré"],
                ["postpaid", "Pós"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setServerFilter(value)} className={`rounded-xl border px-3 py-2 text-xs transition ${serverFilter === value ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}>{label}</button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={serverSearch} onChange={(event) => setServerSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Pesquisar servidor" />
            </div>
          </div>

          <div className="grid max-h-[680px] gap-3 overflow-y-auto pr-1">
            {loading ? (
              <GlassCard className="p-8 text-center text-sm text-slate-400">Carregando servidores...</GlassCard>
            ) : filteredServers.length === 0 ? (
              <GlassCard className="p-8 text-center text-sm text-slate-400">Nenhum servidor disponível.</GlassCard>
            ) : filteredServers.map((server) => (
              <button key={server.id} type="button" onClick={() => selectServer(server)} className={`rounded-2xl border p-4 text-left transition ${selectedServerId === server.id ? "border-cyan-300/50 bg-cyan-300/10 shadow-lg shadow-cyan-950/20" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05]"><Server className="h-5 w-5 text-cyan-200" /></div>
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg text-white">{server.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatMoney(getServerCreditPrice(server))}/crédito · mín. {server.minimum_credits || 1}</div>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${server.billing_type === "prepaid" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
                    {server.billing_type === "prepaid" ? "PRÉ" : "PÓS"}
                  </span>
                </div>
                {server.base_url && <div className="mt-3 truncate text-xs text-slate-500">{server.base_url}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/50">{label}</div>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 font-display text-base text-white">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard className="p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 font-display text-2xl text-white">{value}</div>
    </GlassCard>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getServerCreditPrice(server: ServerRow | null) {
  if (!server) return 0;
  const metadata = typeof server.metadata === "object" && server.metadata !== null && !Array.isArray(server.metadata) ? server.metadata : {};
  const metadataPrice = typeof metadata.credit_price === "number" ? metadata.credit_price : undefined;
  const legacyPrice = typeof metadata.legacy_credit_price === "number" ? metadata.legacy_credit_price : undefined;
  return Number(server.credit_price || metadataPrice || legacyPrice || 0);
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/50 focus:outline-none";
