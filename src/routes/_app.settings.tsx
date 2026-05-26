import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { User, Bell, Palette, Shield, Globe, Key, Bot } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

const tabs = [
  { id: "profile", l: "Profile", i: User },
  { id: "branding", l: "White-label", i: Palette },
  { id: "ai", l: "AI", i: Bot },
  { id: "notifications", l: "Notifications", i: Bell },
  { id: "security", l: "Security", i: Shield },
  { id: "api", l: "API & Webhooks", i: Key },
  { id: "regions", l: "Regions", i: Globe },
];

function Toggle({ on = true }: { on?: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button onClick={() => setV(!v)} className={`relative h-6 w-11 rounded-full border transition ${v ? "bg-gradient-to-r from-cyan-400 to-violet-500 border-cyan-400/50 shadow-[0_0_15px_-3px_#F59E0B]" : "bg-white/5 border-white/10"}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${v ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Settings() {
  const [tab, setTab] = useState("profile");
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Workspace, branding, AI, security and integrations."
        actions={<NeonButton>Save changes</NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 md:col-span-3 p-3">
          <div className="space-y-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${tab === t.id ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/10 border border-cyan-400/30 text-white" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                <t.i className="h-4 w-4" /> {t.l}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 md:col-span-9 p-6">
          {tab === "profile" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 glow-cyan" />
                <div>
                  <div className="font-display text-xl text-white">Alex Mercer</div>
                  <div className="text-xs text-slate-400">Admin · Acme Corp · Quantum tier</div>
                  <button className="mt-2 text-xs text-cyan-300 hover:text-cyan-200">Change avatar</button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[["Full name", "Alex Mercer"], ["Email", "alex@acme.io"], ["Role", "Administrator"], ["Timezone", "UTC+1 · Madrid"]].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-slate-400">{l}</label>
                    <input defaultValue={v} className="mt-1.5 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "branding" && (
            <div className="space-y-5">
              <div className="font-display text-xl text-white">White-label</div>
              <div className="grid md:grid-cols-2 gap-4">
                {[["Brand name", "Nexus by Acme"], ["Primary color", "#F59E0B"], ["Domain", "ops.acme.io"], ["Support email", "support@acme.io"]].map(([l, v]) => (
                  <div key={l}>
                    <label className="text-xs text-slate-400">{l}</label>
                    <input defaultValue={v} className="mt-1.5 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm" />
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-400/20">
                <div className="text-sm text-white">Preview</div>
                <div className="mt-2 h-24 rounded-xl bg-[#0B0F14] border border-white/10 grid place-items-center font-display text-2xl text-gradient">Nexus by Acme</div>
              </div>
            </div>
          )}

          {tab !== "profile" && tab !== "branding" && (
            <div className="space-y-4">
              <div className="font-display text-xl text-white">{tabs.find(t => t.id === tab)?.l}</div>
              {[
                "Receive realtime alerts on Slack and email.",
                "Enable AI auto-suggestions in every inbox.",
                "Two-factor authentication for all admins.",
                "Allow reseller portals to override branding.",
                "Geo-pin data storage to EU region.",
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-sm text-white">{t}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Recommended for production workspaces.</div>
                  </div>
                  <Toggle on={i % 2 === 0} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
