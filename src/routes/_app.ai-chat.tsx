import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Sparkles, Send, Paperclip, Mic, Plus, Bot, Wand2 } from "lucide-react";

export const Route = createFileRoute("/_app/ai-chat")({ component: AIChat });

const threads = [
  { id: 1, name: "Aurora · Strategy", last: "Draft the Q3 GTM plan", time: "now", active: true },
  { id: 2, name: "Pulse · Data", last: "Cohort retention pivot", time: "2h" },
  { id: 3, name: "Nova · Copy", last: "Email sequence v3", time: "1d" },
  { id: 4, name: "Forge · Code", last: "Refactor webhook handler", time: "2d" },
];

const messages = [
  { from: "user", text: "Aurora, draft a 30-day reactivation campaign for dormant WhatsApp users." },
  { from: "ai", text: "On it. Here's a 3-stage flow with predicted lift of 14–22%:\n\n• Day 1 — Personalized voice note from their last agent.\n• Day 7 — Offer tailored from purchase history (10% off).\n• Day 21 — Win-back with concierge handoff if no reply.\n\nWant me to wire it into the Automation Flows canvas?" },
  { from: "user", text: "Yes, and tag every step with the new ‘Reactivation-Q3’ label." },
];

function AIChat() {
  return (
    <>
      <PageHeader
        title="AI Chat"
        subtitle="Aurora is your AI operations co-pilot. Ask anything across data, copy, code and ops."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> New thread</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5 h-[calc(100vh-260px)]">
        <GlassCard className="col-span-12 md:col-span-3 p-3 flex flex-col">
          <div className="px-2 py-2 text-[10px] tracking-[0.25em] uppercase text-slate-500">Threads</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            {threads.map((t) => (
              <button key={t.id} className={`w-full text-left p-3 rounded-xl transition ${t.active ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/10 border border-cyan-400/30" : "hover:bg-white/5 border border-transparent"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-500">{t.time}</span>
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{t.last}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-9 flex flex-col">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 grid place-items-center glow-cyan">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="text-sm text-white">Aurora · Strategy</div>
              <div className="text-[10px] text-slate-400 tracking-widest uppercase">GPT-Quantum · 128k context</div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Online
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-6 space-y-5">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`flex gap-3 ${m.from === "user" ? "justify-end" : ""}`}>
                {m.from === "ai" && <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 grid place-items-center shrink-0"><Sparkles className="h-4 w-4 text-black" /></div>}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                  m.from === "user"
                    ? "bg-gradient-to-br from-cyan-400/20 to-violet-500/10 border border-cyan-400/30 text-white"
                    : "glass border border-white/10 text-slate-200"}`}>
                  {m.text}
                </div>
                {m.from === "user" && <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 grid place-items-center shrink-0 text-xs text-white">AM</div>}
              </motion.div>
            ))}

            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 grid place-items-center shrink-0"><Sparkles className="h-4 w-4 text-black" /></div>
              <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              {["Summarize last 24h", "Build flow", "Forecast MRR", "Audit RLS"].map((s) => (
                <button key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition">
                  <Wand2 className="h-3 w-3 inline mr-1" />{s}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 focus-within:border-cyan-400/50 transition">
              <button className="p-2 text-slate-400 hover:text-cyan-300"><Paperclip className="h-4 w-4" /></button>
              <textarea rows={1} placeholder="Ask Aurora anything…" className="flex-1 bg-transparent resize-none outline-none text-sm py-2 placeholder:text-slate-500" />
              <button className="p-2 text-slate-400 hover:text-cyan-300"><Mic className="h-4 w-4" /></button>
              <button className="h-9 w-9 grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-black"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
