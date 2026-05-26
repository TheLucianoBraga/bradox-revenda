import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Search, Phone, Video, MoreVertical, Paperclip, Send, Smile, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

type InboxConfig = {
  brand: string;
  accent: string;
  glow: string;
  subtitle: string;
};

const configs: Record<string, InboxConfig> = {
  whatsapp: { brand: "WhatsApp", accent: "from-emerald-400 to-cyan-400", glow: "shadow-[0_0_30px_-5px_#34d399]", subtitle: "End-to-end encrypted · Business API" },
  instagram: { brand: "Instagram", accent: "from-fuchsia-500 via-pink-500 to-amber-400", glow: "shadow-[0_0_30px_-5px_#ec4899]", subtitle: "Direct messages · Meta Graph" },
  telegram: { brand: "Telegram", accent: "from-sky-400 to-cyan-400", glow: "shadow-[0_0_30px_-5px_#38bdf8]", subtitle: "Bot API · Channels · Groups" },
};

export function Inbox({ kind }: { kind: "whatsapp" | "instagram" | "telegram" }) {
  const cfg = configs[kind];
  const chats = [
    { id: 1, name: "Maya Chen", last: "Perfect, sending the contract now ✨", time: "12:48", unread: 2, active: true },
    { id: 2, name: "Helix Robotics", last: "Aurora: pricing PDF attached", time: "12:14", unread: 0 },
    { id: 3, name: "Studio Noir", last: "Loving the new layout!", time: "11:02", unread: 1 },
    { id: 4, name: "Orbit Bank", last: "Scheduled demo for Thursday.", time: "10:21", unread: 0 },
    { id: 5, name: "Lima Telco", last: "Voice note · 0:42", time: "Yest.", unread: 0 },
    { id: 6, name: "Pulse Health", last: "Reactivation flow done.", time: "Yest.", unread: 0 },
  ];
  const messages = [
    { me: false, t: "Hey! Quick question on the enterprise tier.", time: "12:42" },
    { me: false, t: "Can we white-label the customer portal under our domain?", time: "12:42" },
    { me: true,  t: "Absolutely — full white-label is included from the Quantum tier.", time: "12:44" },
    { me: true,  t: "I'll send over a deck with everything in 2 mins.", time: "12:44" },
    { me: false, t: "Perfect, sending the contract now ✨", time: "12:48" },
  ];

  return (
    <>
      <PageHeader
        title={`${cfg.brand} Inbox`}
        subtitle={cfg.subtitle}
        actions={<NeonButton>Compose</NeonButton>}
      />
      <div className="grid grid-cols-12 gap-5 h-[calc(100vh-260px)]">
        <GlassCard className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input placeholder="Search conversations" className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/40" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {chats.map((c) => (
              <button key={c.id} className={`w-full text-left p-3 flex gap-3 border-l-2 transition ${c.active ? "bg-white/5 border-cyan-400" : "border-transparent hover:bg-white/[0.03]"}`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cfg.accent} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 truncate">{c.last}</span>
                    {c.unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400 text-black font-medium">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cfg.accent} ${cfg.glow}`} />
            <div>
              <div className="text-sm text-white">Maya Chen</div>
              <div className="text-[10px] text-slate-400 tracking-widest uppercase">Typing… · last seen 12:48</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {[Phone, Video, MoreVertical].map((Ic, i) => (
                <button key={i} className="h-9 w-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40">
                  <Ic className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-6 space-y-3">
            <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest">Today</div>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`flex ${m.me ? "justify-end" : ""}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.me
                  ? `bg-gradient-to-br ${cfg.accent} text-black ${cfg.glow}`
                  : "glass border border-white/10 text-slate-100"}`}>
                  <div>{m.t}</div>
                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${m.me ? "text-black/70 justify-end" : "text-slate-500"}`}>
                    {m.time} {m.me && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 focus-within:border-cyan-400/50">
              <button className="p-2 text-slate-400 hover:text-cyan-300"><Paperclip className="h-4 w-4" /></button>
              <button className="p-2 text-slate-400 hover:text-cyan-300"><Smile className="h-4 w-4" /></button>
              <textarea rows={1} placeholder={`Reply on ${cfg.brand}…`} className="flex-1 bg-transparent resize-none outline-none text-sm py-2 placeholder:text-slate-500" />
              <button className={`h-9 px-4 rounded-xl bg-gradient-to-r ${cfg.accent} text-black text-sm font-medium flex items-center gap-2`}>
                Send <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
