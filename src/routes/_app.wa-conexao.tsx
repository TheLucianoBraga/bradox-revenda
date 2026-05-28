import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { CheckCircle2, Clock3, MessageCircle, QrCode, RefreshCw, ShieldCheck, Smartphone, Wifi, XCircle } from "lucide-react";
import { useAppSession } from "@/contexts/AppSessionContext";
import { ensureWhatsappSession, fetchWhatsappSession, refreshWhatsappRemoteSession, startWhatsappRemoteSession, type WhatsappSessionRow } from "@/services/bradox/whatsapp";

export const Route = createFileRoute("/_app/wa-conexao")({ component: WaConexao });

function WaConexao() {
  const { activeNetworkId, activeNetwork } = useAppSession();
  const [session, setSession] = useState<WhatsappSessionRow | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const status = useMemo(() => getStatusView(session?.status), [session?.status]);

  const reload = async () => {
    setLoading(true);
    try {
      setSession(await fetchWhatsappSession(activeNetworkId));
      setQr(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar a conexao WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [activeNetworkId]);

  const handleEnsureSession = async () => {
    setSaving(true);
    try {
      const prepared = await ensureWhatsappSession(activeNetworkId);
      setSession(prepared);
      setQr(null);
      toast.success("Sessao WhatsApp preparada", { description: prepared.external_session_name });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel preparar a sessao WhatsApp");
    } finally {
      setSaving(false);
    }
  };

  const handleStartSession = async () => {
    setSaving(true);
    try {
      const prepared = session ?? await ensureWhatsappSession(activeNetworkId);
      const result = await startWhatsappRemoteSession(prepared.id);
      setSession(result.session);
      setQr(result.qr);
      toast.success(result.qr ? "QR Code carregado" : "Sessao WhatsApp iniciada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel iniciar a sessao WhatsApp");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshRemote = async () => {
    if (!session) {
      await reload();
      return;
    }

    setSaving(true);
    try {
      const result = await refreshWhatsappRemoteSession(session.id);
      setSession(result.session);
      setQr(result.qr);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel consultar o WAHA");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="WhatsApp · Conexão API"
        subtitle="Conecte uma instância isolada do WhatsApp para esta rede sem tocar em sessões de outros projetos."
        actions={<NeonButton variant="ghost" onClick={() => void handleRefreshRemote()} disabled={loading || saving}><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Atualizar status</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-5 p-6">
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Status</div>
          <div className="mt-2 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${status.dot}`} />
            <div className="font-display text-xl text-white">{loading ? "Carregando" : status.label}</div>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Rede <span className="text-cyan-300">{activeNetwork?.name ?? "nao selecionada"}</span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><Smartphone className="h-4 w-4 text-cyan-300" /> Número</div>
              <div className="text-white text-sm">{session?.phone_number || "Aguardando conexão"}</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><Wifi className="h-4 w-4 text-cyan-300" /> Provedor API</div>
              <div className="text-white text-sm">WAHA Plus</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><MessageCircle className="h-4 w-4 text-cyan-300" /> Sessão isolada</div>
              <div className="max-w-[180px] truncate text-white text-sm font-display" title={session?.external_session_name}>{session?.external_session_name ?? "Nao preparada"}</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><Clock3 className="h-4 w-4 text-cyan-300" /> Última atualização</div>
              <div className="text-white text-sm">{session?.updated_at ? formatDateTime(session.updated_at) : "-"}</div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <NeonButton onClick={handleStartSession} disabled={saving || !activeNetworkId}>{saving ? "Conectando..." : session ? "Iniciar conexão" : "Preparar e iniciar"}</NeonButton>
            <NeonButton variant="ghost" onClick={handleEnsureSession} disabled={saving || !activeNetworkId}>Só preparar</NeonButton>
            <NeonButton variant="ghost" disabled>Desconectar</NeonButton>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-7 p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">WAHA Plus compartilhado</div>
            <div className="font-display text-xl text-white mt-1">Conexão segura por namespace</div>
            <p className="text-xs text-slate-400 mt-1">O sistema só cria e consulta sessões com prefixo <span className="text-cyan-300">bradox-revenda_</span>.</p>

            <div className="mt-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="h-56 w-56 rounded-2xl border border-white/10 bg-white/[0.04] grid place-items-center relative overflow-hidden">
                {qr?.startsWith("data:image/") ? (
                  <img src={qr} alt="QR Code WhatsApp" className="h-full w-full bg-white object-contain p-3" />
                ) : qr ? (
                  <div className="px-4 text-center text-xs text-cyan-100 break-all">{qr}</div>
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                    {status.Icon ? <status.Icon className="h-12 w-12" /> : <QrCode className="h-12 w-12" />}
                  </div>
                )}
              </div>
              <div className="flex-1 text-sm text-slate-300 space-y-2">
                <p>1. Clique em iniciar conexão para criar/iniciar a sessão no WAHA Plus.</p>
                <p>2. O gateway usará exatamente o nome <span className="text-cyan-300">{session?.external_session_name ?? "bradox-revenda_[rede]"}</span>.</p>
                <p>3. Quando o QR aparecer, conecte pelo WhatsApp em Aparelhos conectados.</p>
                <p className="flex items-center gap-2 pt-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4" /> Regra aplicada: nunca listar, reiniciar ou apagar sessões fora do namespace Bradox.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function getStatusView(status?: WhatsappSessionRow["status"]) {
  switch (status) {
    case "connected":
      return { label: "Conectado", dot: "bg-emerald-400 shadow-[0_0_12px_#34d399]", Icon: CheckCircle2 };
    case "starting":
    case "qr":
      return { label: status === "qr" ? "Aguardando QR" : "Iniciando", dot: "bg-amber-300 shadow-[0_0_12px_#fbbf24]", Icon: QrCode };
    case "failed":
      return { label: "Falha", dot: "bg-red-400 shadow-[0_0_12px_#f87171]", Icon: XCircle };
    case "disconnected":
    case "stopped":
      return { label: "Desconectado", dot: "bg-slate-400", Icon: Wifi };
    case "not_configured":
      return { label: "Sessão preparada", dot: "bg-cyan-300 shadow-[0_0_12px_#67e8f9]", Icon: ShieldCheck };
    default:
      return { label: "Nao preparada", dot: "bg-slate-500", Icon: QrCode };
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
