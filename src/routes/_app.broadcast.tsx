import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Megaphone, Users, Send, Image as ImgIcon, Paperclip } from "lucide-react";

export const Route = createFileRoute("/_app/broadcast")({ component: Broadcast });

const servidores = ["Todos", "SX Server", "P2 Premium", "ZTech Cloud", "FastPlay", "GoldTV", "UltraServer"];
const planos = ["Todos", "Starter", "Pro", "Family", "Black"];
const vencimentos = ["Todos", "Vence em 3 dias", "Vence em 7 dias", "Vencidos", "Pagos no mês"];

function Broadcast() {
  const [servidor, setServidor] = useState("Todos");
  const [plano, setPlano] = useState("Todos");
  const [venc, setVenc] = useState("Todos");
  const [msg, setMsg] = useState("Olá, {nome}! Seu plano {plano} vence em breve. Renove e ganhe 10% OFF 🚀");

  const base = 1248;
  const audience = Math.max(80, Math.round(base * (servidor === "Todos" ? 1 : 0.4) * (plano === "Todos" ? 1 : 0.5) * (venc === "Todos" ? 1 : 0.35)));

  return (
    <>
      <PageHeader
        title="Envio em Massa"
        subtitle="Dispare mensagens segmentadas por servidor, plano, vencimento e mais."
        actions={<NeonButton><span className="flex items-center gap-2"><Send className="h-4 w-4" /> Enviar agora</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-4 p-6">
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Filtros de audiência</div>
          <div className="font-display text-lg text-white mt-1">Quem vai receber</div>

          <div className="mt-5 space-y-4 text-sm">
            <Select label="Servidor" value={servidor} onChange={setServidor} options={servidores} />
            <Select label="Plano" value={plano} onChange={setPlano} options={planos} />
            <Select label="Vencimento" value={venc} onChange={setVenc} options={vencimentos} />

            <div className="pt-3 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Audiência estimada</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/30 grid place-items-center text-cyan-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-3xl text-white">{audience.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-slate-400">contatos elegíveis</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-8 p-6">
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Mensagem</div>
          <div className="font-display text-lg text-white mt-1">Componha o broadcast</div>

          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={6}
            className="mt-4 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50 resize-none"
            placeholder="Escreva a mensagem… use {nome}, {plano}, {vencimento} como variáveis."
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["{nome}", "{plano}", "{vencimento}", "{servidor}"].map((v) => (
              <button key={v} onClick={() => setMsg(msg + " " + v)} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400/40">{v}</button>
            ))}
            <div className="ml-auto flex gap-2">
              <button className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 text-slate-300"><ImgIcon className="h-4 w-4" /></button>
              <button className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 text-slate-300"><Paperclip className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
            <div className="text-[10px] uppercase tracking-widest text-emerald-300 flex items-center gap-2"><Megaphone className="h-3 w-3" /> Pré-visualização</div>
            <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{msg.replace(/{nome}/g, "Lucas").replace(/{plano}/g, "Pro").replace(/{vencimento}/g, "10/12").replace(/{servidor}/g, "SX Server")}</div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <NeonButton variant="ghost">Salvar rascunho</NeonButton>
            <NeonButton><span className="flex items-center gap-2"><Send className="h-4 w-4" /> Enviar para {audience.toLocaleString("pt-BR")} contatos</span></NeonButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
      >
        {options.map((o) => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
      </select>
    </div>
  );
}
