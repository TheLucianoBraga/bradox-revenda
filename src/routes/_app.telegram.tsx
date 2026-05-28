import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Bot, Zap, Users, ShieldCheck, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_app/telegram")({ component: TelegramAuto });

function TelegramAuto() {
  return (
    <>
      <PageHeader
        title="Telegram Automation"
        subtitle="Bots, broadcasts, and AI moderation across channels and groups."
        actions={<NeonButton>New bot</NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5 mb-6">
        {[
          { i: Bot, l: "Active bots", v: "14" },
          { i: Users, l: "Subscribers", v: "248,402" },
          { i: Megaphone, l: "Broadcasts (7d)", v: "62" },
          { i: ShieldCheck, l: "Spam blocked", v: "12,884" },
        ].map((s, i) => (
          <GlassCard key={i} className="col-span-6 md:col-span-3 p-5">
            <s.i className="h-5 w-5 text-cyan-300" />
            <div className="mt-3 font-display text-2xl text-white">{s.v}</div>
            <div className="text-xs text-slate-400 mt-1">{s.l}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-7 p-6">
          <div className="font-display text-xl text-white">Bot fleet</div>
          <div className="text-xs text-slate-400 mb-4">Manage every Telegram bot from one console.</div>
          <div className="divide-y divide-white/5">
            {[
              { n: "@nexus_support_bot", role: "Support · L1", subs: "84,210", state: "Live" },
              { n: "@nexus_signals_bot", role: "Crypto signals", subs: "120,043", state: "Live" },
              { n: "@nexus_drops_bot",   role: "Marketing drops", subs: "42,019", state: "Paused" },
              { n: "@nexus_tvonline_bot", role: "Tv Online provisioning", subs: "1,820", state: "Live" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400" />
                <div className="flex-1">
                  <div className="text-sm text-white">{b.n}</div>
                  <div className="text-[11px] text-slate-400">{b.role} · {b.subs} subs</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${b.state === "Live" ? "border-emerald-400/30 text-emerald-300 bg-emerald-400/5" : "border-amber-400/30 text-amber-300 bg-amber-400/5"}`}>{b.state}</span>
                <NeonButton variant="ghost">Configure</NeonButton>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-5 p-6">
          <div className="font-display text-xl text-white flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-300" /> Quick broadcast</div>
          <div className="mt-4 space-y-3">
            <input placeholder="Title" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-cyan-400/50 outline-none" />
            <textarea rows={5} placeholder="Message body. Markdown supported." className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-cyan-400/50 outline-none" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-cyan-400" /> AI optimize copy</label>
              <span>Reach: <span className="text-cyan-300">248,402</span></span>
            </div>
            <div className="flex gap-2">
              <NeonButton className="flex-1">Send now</NeonButton>
              <NeonButton variant="ghost" className="flex-1">Schedule</NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
