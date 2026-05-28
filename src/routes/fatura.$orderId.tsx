import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CheckCircle2, Copy, FileUp, LockKeyhole, Volume2 } from "lucide-react";
import { fetchInvoicePage, submitManualPaymentReceipt, uploadManualPaymentReceiptFile, type InvoicePageRow } from "@/services/bradox/payments";
import { buildPixCopyPaste } from "@/services/bradox/pix";

export const Route = createFileRoute("/fatura/$orderId")({ component: InvoicePage });

function InvoicePage() {
  const { orderId } = Route.useParams();
  const [invoice, setInvoice] = useState<InvoicePageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerDocument, setPayerDocument] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    fetchInvoicePage(orderId)
      .then((data) => { if (active) setInvoice(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar a fatura"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  const pixPayload = useMemo(() => {
    if (!invoice?.manual_pix_key) return "";
    return buildPixCopyPaste({
      pixKey: invoice.manual_pix_key,
      amount: Number(invoice.amount),
      receiverName: invoice.manual_pix_receiver_name || invoice.network_name,
      receiverCity: invoice.manual_pix_receiver_city || "SAO PAULO",
      txid: invoice.id.replace(/-/g, "").slice(0, 25),
      description: `Fatura ${invoice.id.slice(0, 8)}`,
    });
  }, [invoice]);

  useEffect(() => {
    if (!pixPayload) {
      setQrCode("");
      return;
    }
    QRCode.toDataURL(pixPayload, { margin: 1, width: 220, color: { dark: "#081116", light: "#F5F5F3" } })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, [pixPayload]);

  const handleReceipt = async (file?: File) => {
    if (!file || !invoice) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Envie uma imagem ou PDF do comprovante");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Comprovante muito grande", { description: "Use um arquivo de ate 10 MB." });
      return;
    }
    setUploadingReceipt(true);
    try {
      const uploaded = await uploadManualPaymentReceiptFile(invoice.id, file);
      setReceiptFileName(uploaded.fileName);
      setReceiptUrl(uploaded.receiptUrl);
      toast.success("Comprovante anexado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar o comprovante");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const submitReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invoice) return;
    if (!receiptFileName || !receiptUrl) {
      toast.error("Envie o comprovante para continuar");
      return;
    }
    setSending(true);
    try {
      await submitManualPaymentReceipt({
        orderId: invoice.id,
        payerName,
        payerDocument,
        receiptFileName,
        receiptUrl,
      });
      toast.success("Comprovante enviado para analise");
      setInvoice({ ...invoice, status: "awaiting_manual_review" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar o comprovante");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Shell><div className="glass-strong rounded-3xl p-8 text-slate-300">Carregando fatura...</div></Shell>;
  }

  if (!invoice) {
    return <Shell><div className="glass-strong rounded-3xl p-8 text-slate-300">Fatura nao encontrada.</div></Shell>;
  }

  const paid = invoice.status === "paid";
  const awaitingReview = invoice.status === "awaiting_manual_review";

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[560px]">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg tracking-widest text-white">{invoice.network_name}</div>
              <div className="text-xs text-cyan-200/80">Fatura #{invoice.id.slice(0, 8)}</div>
            </div>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
            <Volume2 className="h-4 w-4" />
          </button>
        </header>

        <div className="mb-8 grid grid-cols-[1fr_1fr_1fr] items-start text-center">
          {[
            ["1", "Dados"],
            ["2", "Pagamento"],
            ["3", "Confirmacao"],
          ].map(([step, label], index) => (
            <div key={step} className="relative">
              {index > 0 && <div className="absolute right-1/2 top-4 h-px w-full bg-cyan-300/25" />}
              <div className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${index === 0 ? "bg-cyan-300 text-black" : index === 1 && !paid ? "bg-cyan-300 text-black" : "bg-[#0B2431] text-cyan-200"}`}>{step}</div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{label}</div>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Dados do cliente</div>
            <div className="mt-4 font-display text-2xl text-white">{invoice.customer_name}</div>
            <div className="mt-1 text-sm text-sky-200/75">{invoice.customer_phone || invoice.customer_email || "Contato nao informado"}</div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Detalhes do plano</div>
                <div className="mt-4 font-display text-xl text-white">{invoice.plan_name}</div>
                <div className="mt-1 text-sm text-sky-200/75">Pagamento dentro da pagina de fatura</div>
              </div>
              <div className="text-right text-xl font-bold text-cyan-300">{formatMoney(Number(invoice.amount))}</div>
            </div>
            {invoice.has_custom_price && (
              <div className="mt-5 grid gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/70">Tabela</div>
                  <div className="mt-1 text-white line-through decoration-emerald-200/60">{formatMoney(Number(invoice.table_price))}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/70">Desconto</div>
                  <div className="mt-1 text-emerald-100">{formatMoney(Number(invoice.discount_amount))}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/70">Valor do cliente</div>
                  <div className="mt-1 text-emerald-100">{formatMoney(Number(invoice.amount))}</div>
                </div>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between border-t border-cyan-200/20 pt-4 text-sm">
              <span className="inline-flex items-center gap-2 text-sky-200/75"><Calendar className="h-4 w-4" /> Vencimento</span>
              <strong className="text-white">{formatDate(invoice.due_date)}</strong>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Pix manual</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{invoice.manual_instructions || "Pague pelo Pix abaixo e envie o comprovante para liberar a analise."}</p>
              </div>
              {qrCode && <img src={qrCode} alt="QR Code Pix" className="h-28 w-28 rounded-2xl bg-white p-2" />}
            </div>
            {pixPayload ? (
              <div className="mt-5 grid gap-3">
                <textarea readOnly value={pixPayload} className="min-h-24 rounded-2xl border border-cyan-200/15 bg-black/30 p-3 text-xs text-slate-200 outline-none" />
                <button type="button" onClick={() => copyText(pixPayload)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-300 font-semibold text-black transition hover:bg-cyan-200">
                  <Copy className="h-4 w-4" /> Copiar Pix copia e cola
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">Pix manual ainda nao configurado para esta rede.</div>
            )}
          </Card>

          <Card>
            {paid || awaitingReview ? (
              <div className="flex items-center gap-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-5 w-5" /> {paid ? "Pagamento confirmado." : "Comprovante recebido e aguardando analise."}
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submitReceipt}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Enviar comprovante</div>
                <input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="Nome de quem pagou" className={invoiceInputClass} />
                <input value={payerDocument} onChange={(event) => setPayerDocument(event.target.value)} placeholder="CPF/CNPJ ou identificacao" className={invoiceInputClass} />
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-cyan-200/25 bg-cyan-200/5 px-4 py-4 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2"><FileUp className="h-4 w-4" /> {uploadingReceipt ? "Enviando comprovante..." : receiptFileName || "Selecionar comprovante"}</span>
                  <input type="file" accept="image/*,.pdf" className="sr-only" disabled={uploadingReceipt} onChange={(event) => handleReceipt(event.target.files?.[0])} />
                </label>
                <button type="submit" disabled={sending || uploadingReceipt || !pixPayload} className="h-12 w-full rounded-2xl bg-cyan-300 font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? "Enviando..." : "Enviar comprovante"}
                </button>
              </form>
            )}
          </Card>
        </section>

        <a href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-200"><ArrowLeft className="h-4 w-4" /> Voltar para login</a>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#06090C] px-5 py-8 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(18,214,235,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(255,194,71,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
      <div className="relative">{children}</div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">{children}</div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function copyText(value: string) {
  navigator.clipboard.writeText(value).then(() => toast.success("Pix copiado"));
}

const invoiceInputClass = "h-12 w-full rounded-2xl border border-cyan-200/15 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60";
