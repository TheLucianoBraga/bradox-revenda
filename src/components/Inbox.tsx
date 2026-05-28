import { GlassCard, PageHeader } from "@/components/ui-kit";

export function Inbox({ kind }: { kind: "whatsapp" | "instagram" | "telegram" }) {
  const label = kind === "whatsapp" ? "WhatsApp" : kind === "instagram" ? "Instagram" : "Telegram";
  return (
    <>
      <PageHeader
        title={`${label} Inbox`}
        subtitle="Conversas reais serao exibidas aqui quando o canal estiver conectado."
      />
      <GlassCard className="p-10 text-center text-sm text-slate-400">
        Nenhuma conversa sincronizada.
      </GlassCard>
    </>
  );
}
