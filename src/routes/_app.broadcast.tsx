import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/_app/broadcast")({ component: Broadcast });

function Broadcast() {
  return (
    <>
      <PageHeader
        title="Envio em massa"
        subtitle="Campanhas reais de WhatsApp serao listadas aqui quando a fila estiver conectada."
      />
      <GlassCard className="p-10 text-center text-sm text-slate-400">
        Nenhuma campanha registrada.
      </GlassCard>
    </>
  );
}
