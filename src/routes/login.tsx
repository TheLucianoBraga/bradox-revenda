import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Particles } from "@/components/Particles";
import { Sparkles, ShieldCheck, Github, Chrome } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none fixed inset-0"><Particles density={60} /></div>

      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 grid place-items-center glow-cyan">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="font-display tracking-widest">BR REVENDA</div>
            <div className="text-[10px] tracking-[0.3em] text-slate-400">IPTV CONTROL</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05]">
            O <span className="text-gradient">centro de controle</span><br />da sua revenda IPTV.
          </h1>
          <p className="mt-5 text-slate-400 max-w-md">Conteúdos, servidores, cobranças, planos e WhatsApp em massa — tudo em um lugar, com a performance que sua operação exige.</p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "12,4M", v: "Conversas" },
              { k: "99,99%", v: "Disponibilidade" },
              { k: "180+", v: "Integrações" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-2xl p-4">
                <div className="font-display text-2xl text-white">{s.k}</div>
                <div className="text-[11px] text-slate-400 mt-1 tracking-wider uppercase">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> SOC 2 · ISO 27001 · GDPR compliant
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-strong rounded-3xl p-8 border-gradient relative">
          <div className="text-[10px] tracking-[0.3em] text-cyan-300/80 uppercase">Welcome back</div>
          <h2 className="font-display text-3xl mt-1">Entrar no Br Revenda</h2>
          <p className="text-sm text-slate-400 mt-2">Acesse seu painel e gerencie toda a sua operação IPTV.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 text-sm">
              <Chrome className="h-4 w-4" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 text-sm">
              <Github className="h-4 w-4" /> GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-widest">
            <div className="h-px flex-1 bg-white/10" /> or with email <div className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input type="email" defaultValue="alex@acme.io" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Password</label>
                <a className="text-xs text-cyan-300 hover:text-cyan-200" href="#">Forgot?</a>
              </div>
              <input type="password" defaultValue="••••••••••" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm" />
            </div>
            <Link to="/dashboard" className="block">
              <button type="button" className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-medium glow-cyan">
                Enter workspace →
              </button>
            </Link>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            No account? <a className="text-cyan-300 hover:text-cyan-200" href="#">Request access</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
