import { ReactNode } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function GlassCard({
  children,
  className = "",
  glow = false,
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
}) {
  const Cmp: any = interactive ? motion.div : "div";
  const motionProps = interactive
    ? {
        whileHover: { y: -3 },
        transition: { type: "spring", stiffness: 260, damping: 24 },
      }
    : {};
  return (
    <Cmp
      {...motionProps}
      className={`relative rounded-[18px] glass overflow-hidden ${glow ? "glow-cyan" : ""} ${className}`}
    >
      {children}
    </Cmp>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow = "BR Revenda",
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-wrap items-end justify-between gap-4 mb-10"
    >
      <div>
        <div className="label-eyebrow">{eyebrow}</div>
        <h1 className="font-display text-[34px] md:text-[40px] leading-[1.02] text-white mt-2.5 tracking-[-0.034em]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#A1A1AA] mt-3 max-w-2xl text-[14px] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function NeonButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  ...props
}: any) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3.5 h-9 rounded-[10px] text-[13px] font-medium transition";
  const styles = variant === "primary" ? "btn-primary" : "btn-secondary";
  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) return onClick(e);
    const label = (e.currentTarget.innerText || "Ação").trim().split("\n")[0];
    toast.success(label, { description: "Ação executada com sucesso." });
  };
  return (
    <button
      {...props}
      data-handled="true"
      onClick={handle}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatPill({
  value,
  label,
  accent = "cyan",
}: {
  value: string;
  label: string;
  accent?: "cyan" | "violet" | "emerald";
}) {
  const colors: Record<string, string> = {
    cyan: "text-[#FFC247] bg-[rgba(255,194,71,0.08)] border-[rgba(255,194,71,0.20)]",
    violet: "text-[#FFB020] bg-[rgba(255,176,32,0.08)] border-[rgba(255,176,32,0.20)]",
    emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  };
  return (
    <div
      className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${colors[accent]}`}
    >
      <span className="font-semibold">{value}</span>{" "}
      <span className="opacity-80">{label}</span>
    </div>
  );
}
