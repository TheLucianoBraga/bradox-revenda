import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { MessageCircle, QrCode, Wifi, RefreshCw, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_app/wa-conexao")({ component: WaConexao });

function WaConexao() {
  return (
    <>
      <PageHeader
        title="WhatsApp · Conexão API"
        subtitle="Conecte uma instância do WhatsApp para enviar mensagens em massa e atender suas revendas."
        actions={<NeonButton variant="ghost"><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Atualizar QR</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-5 p-6">
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Status</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
            <div className="font-display text-xl text-white">Conectado</div>
          </div>
          <div className="mt-1 text-xs text-slate-400">Instância <span className="text-cyan-300">br-revenda-01</span> · Online há 4d 12h</div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><Smartphone className="h-4 w-4 text-cyan-300" /> Número</div>
              <div className="text-white text-sm">+55 11 98765-4321</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><Wifi className="h-4 w-4 text-cyan-300" /> Provedor API</div>
              <div className="text-white text-sm">UAZAPI</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300"><MessageCircle className="h-4 w-4 text-cyan-300" /> Mensagens (24h)</div>
              <div className="text-white text-sm font-display">2.481</div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <NeonButton>Testar envio</NeonButton>
            <NeonButton variant="ghost">Desconectar</NeonButton>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-7 p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Nova conexão</div>
            <div className="font-display text-xl text-white mt-1">Escaneie o QR Code</div>
            <p className="text-xs text-slate-400 mt-1">Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho.</p>

            <div className="mt-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="h-56 w-56 rounded-2xl bg-white grid place-items-center relative">
                <div className="absolute inset-2 grid grid-cols-12 grid-rows-12 gap-px">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? "bg-black" : "bg-white"}`} />
                  ))}
                </div>
                <QrCode className="relative h-14 w-14 text-cyan-500" />
              </div>
              <div className="flex-1 text-sm text-slate-300 space-y-2">
                <p>1. Abra o WhatsApp no seu celular.</p>
                <p>2. Toque em <span className="text-cyan-300">Mais opções</span> ou <span className="text-cyan-300">Configurações</span>.</p>
                <p>3. Toque em <span className="text-cyan-300">Aparelhos conectados</span> e em <span className="text-cyan-300">Conectar um aparelho</span>.</p>
                <p>4. Aponte a câmera para este QR Code.</p>
                <p className="text-xs text-slate-500 pt-2">QR expira em 60s. Recarregue se necessário.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
