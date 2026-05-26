import { ReactNode } from "react";
import { motion } from "framer-motion";

export function GlassCard({ children, className = "", glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl glass overflow-hidden ${glow ? "glow-cyan" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">Br Revenda</div>
        <h1 className="font-display text-3xl md:text-4xl text-white mt-1">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

import { toast } from "sonner";

export function NeonButton({ children, variant = "primary", className = "", onClick, ...props }: any) {
  const styles = variant === "primary"
    ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:shadow-[0_0_30px_-5px_#F59E0B]"
    : "bg-white/5 border border-white/10 text-white hover:border-cyan-400/40";
  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) return onClick(e);
    const label = (e.currentTarget.innerText || "Ação").trim().split("\n")[0];
    toast.success(label, { description: "Ação executada com sucesso." });
  };
  return (
    <button {...props} data-handled="true" onClick={handle} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function StatPill({ value, label, accent = "cyan" }: { value: string; label: string; accent?: "cyan" | "violet" | "emerald" }) {
  const colors: Record<string, string> = {
    cyan: "from-cyan-400/20 to-cyan-500/0 text-cyan-300",
    violet: "from-violet-400/20 to-violet-500/0 text-violet-300",
    emerald: "from-emerald-400/20 to-emerald-500/0 text-emerald-300",
  };
  return (
    <div className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${colors[accent]} border border-white/10 text-[11px]`}>
      <span className="font-semibold">{value}</span> <span className="opacity-70">{label}</span>
    </div>
  );
}
