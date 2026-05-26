import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import {
  Megaphone, Users, Send, Image as ImgIcon, Paperclip, Filter, Gauge,
  Clock, Repeat, Pause, Play, X, CheckCircle2, AlertTriangle, ListChecks,
  Calendar, ChevronDown, Tag, Server as ServerIcon, Store, Layers,
  Bold, Italic, Strikethrough, Code, Sparkles, Copy, FileText, Smile,
} from "lucide-react";

export const Route = createFileRoute("/_app/broadcast")({ component: Broadcast });

/* ---------- Mock data ---------- */

const REVENDAS = [
  { id: "r1", nome: "Master BR", contatos: 480 },
  { id: "r2", nome: "Aurora Tech", contatos: 312 },
  { id: "r3", nome: "Lima Streams", contatos: 198 },
  { id: "r4", nome: "NorteTV", contatos: 124 },
  { id: "r5", nome: "Sertão Play", contatos: 134 },
];
const SERVIDORES = [
  { id: "s1", nome: "SX Server", contatos: 420 },
  { id: "s2", nome: "P2 Premium", contatos: 268 },
  { id: "s3", nome: "ZTech Cloud", contatos: 210 },
  { id: "s4", nome: "FastPlay", contatos: 180 },
  { id: "s5", nome: "GoldTV", contatos: 170 },
];
const SEGMENTOS = [
  { id: "g1", nome: "Vence em 3 dias", contatos: 142, cor: "amber" },
  { id: "g2", nome: "Vence em 7 dias", contatos: 287, cor: "amber" },
  { id: "g3", nome: "Vencidos", contatos: 96, cor: "rose" },
  { id: "g4", nome: "Renovou no mês", contatos: 412, cor: "emerald" },
  { id: "g5", nome: "Novos (30d)", contatos: 88, cor: "cyan" },
  { id: "g6", nome: "Inativos 60d", contatos: 165, cor: "violet" },
  { id: "g7", nome: "VIP", contatos: 54, cor: "amber" },
];
const PLANOS = ["Todos", "Starter", "Pro", "Family", "Black"];
const STATUS = ["Todos", "Ativos", "Suspensos", "Teste"];

const FILA_INICIAL = [
  { id: "c-014", nome: "Reativação 7d · Outubro", status: "Enviando", total: 1820, enviadas: 1124, falhas: 12, rate: 38, eta: "8m", canal: "WhatsApp" },
  { id: "c-013", nome: "Promo Black 50% OFF", status: "Enfileirada", total: 2540, enviadas: 0, falhas: 0, rate: 40, eta: "—", canal: "WhatsApp" },
  { id: "c-012", nome: "Aviso manutenção SX", status: "Pausada", total: 980, enviadas: 320, falhas: 4, rate: 30, eta: "—", canal: "WhatsApp" },
  { id: "c-011", nome: "Boas-vindas novos", status: "Concluída", total: 88, enviadas: 86, falhas: 2, rate: 25, eta: "0m", canal: "WhatsApp" },
];

const TEMPLATES = [
  {
    id: "t1",
    nome: "Aviso de vencimento",
    categoria: "Cobrança",
    cor: "amber",
    conteudo:
      "Olá *{nome}*! 👋\n\nSeu plano *{plano}* no servidor _{servidor}_ vence em *{vencimento}*.\n\nRenove agora e ganhe *10% OFF* 🚀\n\n— Equipe {revenda}",
  },
  {
    id: "t2",
    nome: "Boas-vindas",
    categoria: "Onboarding",
    cor: "emerald",
    conteudo:
      "Seja muito bem-vindo(a), *{nome}*! 🎉\n\nSeu acesso ao *{plano}* já está ativo no servidor _{servidor}_.\n\nQualquer dúvida, fale com a *{revenda}*. Bom streaming! 📺",
  },
  {
    id: "t3",
    nome: "Reativação cliente inativo",
    categoria: "Retenção",
    cor: "violet",
    conteudo:
      "Oi, *{nome}*! Sentimos sua falta. 💜\n\nVoltando hoje no plano *{plano}*, você ganha *7 dias extras* grátis.\n\nResponda *EU QUERO* que ativamos pra você.\n\n— {revenda}",
  },
  {
    id: "t4",
    nome: "Promo flash",
    categoria: "Promoção",
    cor: "rose",
    conteudo:
      "🔥 *PROMO RELÂMPAGO* 🔥\n\n*{nome}*, só hoje: *50% OFF* na renovação do *{plano}*!\n\n⏰ Válido até às 23h59.\n\nClique para garantir 👉",
  },
  {
    id: "t5",
    nome: "Aviso de manutenção",
    categoria: "Operacional",
    cor: "cyan",
    conteudo:
      "⚙️ *Aviso técnico*\n\nOlá, *{nome}*. O servidor _{servidor}_ passará por manutenção em *{vencimento}*, das 03h às 05h.\n\nAgradecemos a compreensão.\n— {revenda}",
  },
  {
    id: "t6",
    nome: "Confirmação de pagamento",
    categoria: "Financeiro",
    cor: "emerald",
    conteudo:
      "✅ Pagamento confirmado!\n\n*{nome}*, recebemos sua renovação do *{plano}*.\n\nNovo vencimento: *{vencimento}*\nServidor: _{servidor}_\n\nObrigado pela confiança! 💛",
  },
];

const VARIAVEIS = [
  { tag: "{nome}", desc: "Nome do cliente", exemplo: "Lucas" },
  { tag: "{plano}", desc: "Plano contratado", exemplo: "Pro" },
  { tag: "{vencimento}", desc: "Data de vencimento", exemplo: "10/12/2026" },
  { tag: "{servidor}", desc: "Servidor IPTV", exemplo: "SX Server" },
  { tag: "{revenda}", desc: "Nome da revenda", exemplo: "Master BR" },
];

/* ---------- Component ---------- */

function Broadcast() {
  const [revendas, setRevendas] = useState<string[]>([]);
  const [servidores, setServidores] = useState<string[]>([]);
  const [segmentos, setSegmentos] = useState<string[]>(["g2"]);
  const [plano, setPlano] = useState("Todos");
  const [status, setStatus] = useState("Ativos");

  const [rate, setRate] = useState(30); // msgs por minuto
  const [retry, setRetry] = useState(2);
  const [agendar, setAgendar] = useState(false);
  const [quando, setQuando] = useState("");

  const [msg, setMsg] = useState(
    "Olá, {nome}! Seu plano {plano} no servidor {servidor} vence em {vencimento}.\nRenove e ganhe 10% OFF 🚀\n\n— Equipe Br Revenda"
  );

  const [fila, setFila] = useState(FILA_INICIAL);

  /* Audience math (mock) */
  const audience = useMemo(() => {
    const baseRev = revendas.length
      ? REVENDAS.filter(r => revendas.includes(r.id)).reduce((s, r) => s + r.contatos, 0)
      : REVENDAS.reduce((s, r) => s + r.contatos, 0);
    const baseServ = servidores.length
      ? SERVIDORES.filter(s => servidores.includes(s.id)).reduce((s, x) => s + x.contatos, 0)
      : SERVIDORES.reduce((s, x) => s + x.contatos, 0);
    const baseSeg = segmentos.length
      ? SEGMENTOS.filter(s => segmentos.includes(s.id)).reduce((s, x) => s + x.contatos, 0)
      : SEGMENTOS.reduce((s, x) => s + x.contatos, 0);

    const interseccao = Math.min(baseRev, baseServ, baseSeg);
    const planoFactor = plano === "Todos" ? 1 : 0.55;
    const statusFactor = status === "Todos" ? 1 : status === "Ativos" ? 0.78 : status === "Suspensos" ? 0.12 : 0.1;
    return Math.max(0, Math.round(interseccao * planoFactor * statusFactor));
  }, [revendas, servidores, segmentos, plano, status]);

  const duracaoMin = rate > 0 ? Math.ceil(audience / rate) : 0;
  const duracaoLabel = duracaoMin >= 60 ? `${Math.floor(duracaoMin / 60)}h ${duracaoMin % 60}m` : `${duracaoMin}m`;

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const enfileirar = () => {
    if (audience === 0) return;
    const novo = {
      id: `c-${String(Math.floor(Math.random() * 900) + 100)}`,
      nome: msg.split("\n")[0].slice(0, 40) || "Nova campanha",
      status: agendar ? "Agendada" : "Enfileirada",
      total: audience,
      enviadas: 0,
      falhas: 0,
      rate,
      eta: "—",
      canal: "WhatsApp",
    };
    setFila([novo, ...fila]);
  };

  const updateStatus = (id: string, novoStatus: string) =>
    setFila(fila.map(f => f.id === id ? { ...f, status: novoStatus } : f));
  const remover = (id: string) => setFila(fila.filter(f => f.id !== id));

  return (
    <>
      <PageHeader
        title="Envio em Massa"
        subtitle="Dispare campanhas segmentadas por revenda, servidor e segmento — com controle de fila e throttling."
        actions={
          <>
            <NeonButton variant="ghost"><span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Modelos</span></NeonButton>
            <NeonButton><span className="flex items-center gap-2" onClick={enfileirar}><Send className="h-4 w-4" /> Enfileirar campanha</span></NeonButton>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {/* FILTROS */}
        <GlassCard className="col-span-12 xl:col-span-4 p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-300/80">
            <Filter className="h-3 w-3" /> Filtros de audiência
          </div>
          <div className="font-display text-lg text-white mt-1">Quem vai receber</div>

          <div className="mt-5 space-y-5 text-sm">
            <MultiChips
              icon={Store}
              label="Revendas"
              hint="Vazio = todas"
              items={REVENDAS}
              selected={revendas}
              onToggle={(id) => toggle(revendas, setRevendas, id)}
              onClear={() => setRevendas([])}
            />
            <MultiChips
              icon={ServerIcon}
              label="Servidores"
              hint="Vazio = todos"
              items={SERVIDORES}
              selected={servidores}
              onToggle={(id) => toggle(servidores, setServidores, id)}
              onClear={() => setServidores([])}
            />
            <MultiChips
              icon={Layers}
              label="Segmentos"
              hint="Combine para refinar"
              items={SEGMENTOS}
              selected={segmentos}
              onToggle={(id) => toggle(segmentos, setSegmentos, id)}
              onClear={() => setSegmentos([])}
              colored
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField icon={Tag} label="Plano" value={plano} onChange={setPlano} options={PLANOS} />
              <SelectField icon={CheckCircle2} label="Status" value={status} onChange={setStatus} options={STATUS} />
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Audiência estimada</div>
              <div className="mt-2 flex items-end gap-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 grid place-items-center text-cyan-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-3xl text-white leading-none">{audience.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-slate-400 mt-1">contatos elegíveis · ~{duracaoLabel} para concluir</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* MENSAGEM + FILA SETTINGS */}
        <div className="col-span-12 xl:col-span-8 space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Mensagem</div>
            <div className="font-display text-lg text-white mt-1">Componha o broadcast</div>

            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={6}
              className="mt-4 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50 resize-none font-sans"
              placeholder="Escreva a mensagem… use {nome}, {plano}, {vencimento}, {servidor}, {revenda} como variáveis."
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {["{nome}", "{plano}", "{vencimento}", "{servidor}", "{revenda}"].map((v) => (
                <button key={v} onClick={() => setMsg(msg + " " + v)} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400/40">{v}</button>
              ))}
              <div className="ml-auto flex gap-2">
                <button className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 text-slate-300" title="Anexar imagem"><ImgIcon className="h-4 w-4" /></button>
                <button className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 text-slate-300" title="Anexar arquivo"><Paperclip className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300 flex items-center gap-2"><Megaphone className="h-3 w-3" /> Pré-visualização</div>
              <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                {msg
                  .replace(/{nome}/g, "Lucas")
                  .replace(/{plano}/g, "Pro")
                  .replace(/{vencimento}/g, "10/12")
                  .replace(/{servidor}/g, "SX Server")
                  .replace(/{revenda}/g, "Master BR")}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-300/80">
              <Gauge className="h-3 w-3" /> Fila e throttling
            </div>
            <div className="font-display text-lg text-white mt-1">Controle de envio</div>

            <div className="mt-5 grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Gauge className="h-3 w-3" /> Velocidade</label>
                <div className="mt-2 flex items-center gap-3">
                  <input type="range" min={5} max={120} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="flex-1 accent-amber-400" />
                  <div className="w-20 text-right">
                    <div className="font-display text-xl text-white leading-none">{rate}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">msg/min</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Repeat className="h-3 w-3" /> Retentativas</label>
                <select value={retry} onChange={(e) => setRetry(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50">
                  {[0, 1, 2, 3, 5].map(n => <option key={n} value={n} className="bg-black">{n} tentativa{n === 1 ? "" : "s"}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Janela de envio</label>
                <select className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50" defaultValue="08-21">
                  <option value="24" className="bg-black">24h (sem restrição)</option>
                  <option value="08-21" className="bg-black">08:00 às 21:00</option>
                  <option value="09-18" className="bg-black">09:00 às 18:00 (comercial)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} className="accent-amber-400 h-4 w-4" />
                <Calendar className="h-4 w-4 text-slate-400" /> Agendar disparo
              </label>
              {agendar && (
                <input
                  type="datetime-local"
                  value={quando}
                  onChange={(e) => setQuando(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              )}
              <div className="ml-auto flex gap-2">
                <NeonButton variant="ghost">Salvar rascunho</NeonButton>
                <NeonButton>
                  <span className="flex items-center gap-2" onClick={enfileirar}>
                    <Send className="h-4 w-4" />
                    {agendar ? "Agendar" : "Enfileirar"} · {audience.toLocaleString("pt-BR")}
                  </span>
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* FILA */}
        <GlassCard className="col-span-12 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">Fila WhatsApp</div>
              <div className="font-display text-lg text-white mt-1">Campanhas em andamento</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" /> Enviando</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Enfileirada</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Pausada</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Concluída</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="text-left py-2 px-3 font-medium">Campanha</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium w-[28%]">Progresso</th>
                  <th className="text-right py-2 px-3 font-medium">Vel.</th>
                  <th className="text-right py-2 px-3 font-medium">Falhas</th>
                  <th className="text-right py-2 px-3 font-medium">ETA</th>
                  <th className="text-right py-2 px-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {fila.map((c) => {
                    const pct = c.total ? Math.round((c.enviadas / c.total) * 100) : 0;
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="border-t border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="py-3 px-3">
                          <div className="text-white">{c.nome}</div>
                          <div className="text-[10px] text-slate-500 tracking-wider">#{c.id} · {c.canal}</div>
                        </td>
                        <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full ${c.status === "Concluída" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-300 w-24 text-right tabular-nums">
                              {c.enviadas.toLocaleString("pt-BR")}/{c.total.toLocaleString("pt-BR")}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">{c.rate}/min</td>
                        <td className="py-3 px-3 text-right">
                          {c.falhas > 0
                            ? <span className="inline-flex items-center gap-1 text-rose-300"><AlertTriangle className="h-3 w-3" />{c.falhas}</span>
                            : <span className="text-slate-500">0</span>}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">{c.eta}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            {c.status === "Enviando" && (
                              <IconAct title="Pausar" onClick={() => updateStatus(c.id, "Pausada")}><Pause className="h-3.5 w-3.5" /></IconAct>
                            )}
                            {(c.status === "Pausada" || c.status === "Enfileirada" || c.status === "Agendada") && (
                              <IconAct title="Retomar" onClick={() => updateStatus(c.id, "Enviando")}><Play className="h-3.5 w-3.5" /></IconAct>
                            )}
                            {c.status !== "Concluída" && (
                              <IconAct title="Cancelar" onClick={() => remover(c.id)} danger><X className="h-3.5 w-3.5" /></IconAct>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {fila.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">Nenhuma campanha na fila.</div>
          )}
        </GlassCard>
      </div>
    </>
  );
}

/* ---------- Sub-components ---------- */

function MultiChips({
  icon: Icon, label, hint, items, selected, onToggle, onClear, colored = false,
}: {
  icon: any; label: string; hint?: string;
  items: { id: string; nome: string; contatos: number; cor?: string }[];
  selected: string[]; onToggle: (id: string) => void; onClear: () => void; colored?: boolean;
}) {
  const colorMap: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    rose: "border-rose-400/40 bg-rose-400/10 text-rose-200",
    emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    cyan: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    violet: "border-violet-400/40 bg-violet-400/10 text-violet-200",
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {label}
          {hint && <span className="ml-1 normal-case tracking-normal text-slate-600">· {hint}</span>}
        </label>
        {selected.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-slate-500 hover:text-slate-300">Limpar ({selected.length})</button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it) => {
          const on = selected.includes(it.id);
          const base = colored && it.cor ? colorMap[it.cor] : "border-cyan-400/40 bg-cyan-400/10 text-cyan-200";
          return (
            <button
              key={it.id}
              onClick={() => onToggle(it.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                on ? base : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {it.nome} <span className="opacity-60">· {it.contatos}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ icon: Icon, label, value, onChange, options }: { icon: any; label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Icon className="h-3 w-3" /> {label}</label>
      <div className="relative mt-1.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
        >
          {options.map((o) => <option key={o} value={o} className="bg-black">{o}</option>)}
        </select>
        <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Enviando": "border-amber-400/40 bg-amber-400/10 text-amber-200",
    "Enfileirada": "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    "Agendada": "border-violet-400/40 bg-violet-400/10 text-violet-200",
    "Pausada": "border-slate-400/30 bg-slate-400/10 text-slate-300",
    "Concluída": "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[status] ?? ""}`}>{status}</span>;
}

function IconAct({ children, title, onClick, danger = false }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-7 w-7 grid place-items-center rounded-md border transition ${
        danger
          ? "border-white/10 bg-white/5 text-slate-400 hover:text-rose-300 hover:border-rose-400/40"
          : "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-400/40"
      }`}
    >
      {children}
    </button>
  );
}
