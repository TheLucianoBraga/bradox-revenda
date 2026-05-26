import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MoneyInput } from "@/components/MoneyInput";
import {
  Store, Plus, ChevronDown, Coins, Receipt, Package, Edit3, Trash2, X,
  Search, Mail, Phone, Lock, User as UserIcon, Eye, EyeOff, Check,
} from "lucide-react";

export const Route = createFileRoute("/_app/revendas")({ component: Revendas });

const SERVIDORES_DISPONIVEIS = ["SX Server", "P2 Premium", "ZTech Cloud", "FastPlay", "GoldTV", "UltraServer"];
const PLANOS_DISPONIVEIS = [
  { nome: "Starter", padrao: 29.9 },
  { nome: "Pro", padrao: 49.9 },
  { nome: "Family", padrao: 79.9 },
  { nome: "Black", padrao: 119.9 },
];

type Modo = "creditos" | "pagamento" | "plano";
type ServidorRev = { nome: string; valor: number };
type PlanoRev = { nome: string; valor: number };

type Revenda = {
  id: number;
  nome: string;
  email: string;
  whatsapp: string;
  senha: string;
  cidade?: string;
  clientes: number;
  modos: Modo[];
  servidores: ServidorRev[];
  planos: PlanoRev[];
};

const seed: Revenda[] = [
  {
    id: 1, nome: "Lucas Silva", email: "lucas@brrevenda.com", whatsapp: "(11) 98888-1234", senha: "Lucas@2025!",
    cidade: "São Paulo · SP", clientes: 142, modos: ["creditos", "pagamento"],
    servidores: [{ nome: "P2 Premium", valor: 1.5 }, { nome: "SX Server", valor: 1.8 }],
    planos: [{ nome: "Pro", valor: 45.0 }],
  },
  {
    id: 2, nome: "Aline Costa", email: "aline@brrevenda.com", whatsapp: "(81) 99999-4321", senha: "Aline@Forte9",
    cidade: "Recife · PE", clientes: 88, modos: ["creditos", "plano"],
    servidores: [{ nome: "UltraServer", valor: 1.2 }],
    planos: [{ nome: "Starter", padrao: 29.9, valor: 25.0 } as PlanoRev],
  },
];

const modoMeta: Record<Modo, { label: string; icon: typeof Coins }> = {
  creditos: { label: "Créditos", icon: Coins },
  pagamento: { label: "Pós-pago", icon: Receipt },
  plano: { label: "Plano", icon: Package },
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Revendas() {
  const [items, setItems] = useState<Revenda[]>(seed);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Revenda | null>(null);
  const [toDelete, setToDelete] = useState<Revenda | null>(null);

  const filtered = useMemo(
    () => items.filter((r) =>
      r.nome.toLowerCase().includes(q.toLowerCase()) ||
      r.email.toLowerCase().includes(q.toLowerCase()) ||
      (r.cidade ?? "").toLowerCase().includes(q.toLowerCase())
    ),
    [items, q],
  );

  const onNew = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (r: Revenda) => { setEditing(r); setModalOpen(true); };
  const confirmDelete = () => {
    if (!toDelete) return;
    setItems((arr) => arr.filter((r) => r.id !== toDelete.id));
    toast.success("Revenda removida");
  };
  const onSave = (data: Omit<Revenda, "id"> & { id?: number }) => {
    if (data.id) {
      setItems((arr) => arr.map((r) => (r.id === data.id ? ({ ...r, ...data } as Revenda) : r)));
      toast.success("Revenda atualizada");
    } else {
      const id = items.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setItems((arr) => [{ ...(data as Revenda), id }, ...arr]);
      toast.success("Revenda criada");
    }
    setModalOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Revendas"
        subtitle="Cadastre revendas, vincule servidores e planos e personalize valores por revenda."
        actions={
          <NeonButton onClick={onNew}>
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova revenda</span>
          </NeonButton>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, email ou cidade"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <div className="text-xs text-slate-400">{filtered.length} de {items.length}</div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = open === r.id;
          const totalServ = r.servidores.reduce((s, x) => s + x.valor * r.clientes, 0);
          const totalPlanos = r.planos.reduce((s, x) => s + x.valor, 0);
          return (
            <GlassCard key={r.id} className="p-0 overflow-hidden">
              <div className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02]">
                <button onClick={() => setOpen(isOpen ? null : r.id)} className="flex items-center gap-4 flex-1 text-left">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-500/20 border border-white/10 grid place-items-center">
                    <Store className="h-5 w-5 text-amber-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-white">{r.nome}</div>
                    <div className="text-xs text-slate-400">{r.email} · {r.clientes} clientes</div>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5">
                    {r.modos.map((m) => {
                      const M = modoMeta[m];
                      return (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-200 bg-amber-400/5 flex items-center gap-1">
                          <M.icon className="h-3 w-3" /> {M.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="font-display text-amber-300 hidden sm:block">{fmtBRL(totalServ + totalPlanos)}</div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(r)} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-amber-400/40 text-slate-300" title="Editar">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setToDelete(r)} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-red-400/40 text-slate-300 hover:text-red-300" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-white/5 px-5 py-5 grid grid-cols-12 gap-5 bg-black/20">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Contato</div>
                    <div className="text-sm text-slate-200 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-amber-300" /> {r.email}</div>
                    <div className="text-sm text-slate-200 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-amber-300" /> {r.whatsapp}</div>
                    {r.cidade && <div className="text-xs text-slate-400">{r.cidade}</div>}
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Servidores · valor por cliente</div>
                    {r.servidores.length === 0 && <div className="text-xs text-slate-500">Nenhum vinculado</div>}
                    <div className="space-y-1.5">
                      {r.servidores.map((s) => (
                        <div key={s.nome} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-sm text-white">{s.nome}</span>
                          <span className="text-xs text-amber-300 font-medium">{fmtBRL(s.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Planos contratados</div>
                    {r.planos.length === 0 && <div className="text-xs text-slate-500">Nenhum plano</div>}
                    <div className="space-y-1.5">
                      {r.planos.map((p) => (
                        <div key={p.nome} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-sm text-white">{p.nome}</span>
                          <span className="text-xs text-amber-300 font-medium">{fmtBRL(p.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-16">Nenhuma revenda encontrada.</div>
        )}
      </div>

      <RevendaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={onSave}
      />

      <ConfirmModal
        open={!!toDelete}
        title="Excluir revenda"
        description={toDelete ? `Tem certeza que deseja apagar "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ""}
        confirmLabel="Excluir revenda"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

/* ----------------- Modal ----------------- */

type FormState = {
  nome: string; email: string; whatsapp: string; senha: string; cidade: string; clientes: number;
  modos: Modo[]; servidores: ServidorRev[]; planos: PlanoRev[];
};

const empty: FormState = {
  nome: "", email: "", whatsapp: "", senha: "", cidade: "", clientes: 0,
  modos: ["creditos"], servidores: [], planos: [],
};

function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score; // 0-5
}

function maskWhats(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function RevendaModal({
  open, onClose, initial, onSave,
}: {
  open: boolean; onClose: () => void; initial: Revenda | null;
  onSave: (r: Omit<Revenda, "id"> & { id?: number }) => void;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? {
      nome: initial.nome, email: initial.email, whatsapp: initial.whatsapp, senha: initial.senha,
      cidade: initial.cidade ?? "", clientes: initial.clientes, modos: initial.modos,
      servidores: initial.servidores, planos: initial.planos,
    } : empty);
    setShowPass(false);
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const strength = passwordStrength(form.senha);
  const strengthLabel = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte", "Excelente"][strength];
  const strengthColor = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-400"][strength];

  const toggleModo = (m: Modo) =>
    setForm((f) => ({ ...f, modos: f.modos.includes(m) ? f.modos.filter((x) => x !== m) : [...f.modos, m] }));

  const toggleServidor = (nome: string) => {
    setForm((f) => {
      const exists = f.servidores.find((s) => s.nome === nome);
      return {
        ...f,
        servidores: exists
          ? f.servidores.filter((s) => s.nome !== nome)
          : [...f.servidores, { nome, valor: 1.5 }],
      };
    });
  };
  const setServValor = (nome: string, valor: number) =>
    setForm((f) => ({ ...f, servidores: f.servidores.map((s) => s.nome === nome ? { ...s, valor } : s) }));

  const togglePlano = (nome: string, padrao: number) => {
    setForm((f) => {
      const exists = f.planos.find((p) => p.nome === nome);
      return {
        ...f,
        planos: exists
          ? f.planos.filter((p) => p.nome !== nome)
          : [...f.planos, { nome, valor: padrao }],
      };
    });
  };
  const setPlanoValor = (nome: string, valor: number) =>
    setForm((f) => ({ ...f, planos: f.planos.map((p) => p.nome === nome ? { ...p, valor } : p) }));

  const submit = () => {
    if (!form.nome.trim()) return toast.error("Informe o nome");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Email inválido");
    if (form.whatsapp.replace(/\D/g, "").length < 10) return toast.error("WhatsApp inválido");
    if (strength < 4) return toast.error("Senha precisa ser forte (mín. 8 caracteres, maiúsc., minúsc., número e símbolo)");
    if (form.modos.length === 0) return toast.error("Selecione ao menos um modo de cobrança");

    onSave({
      id: initial?.id,
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp,
      senha: form.senha,
      cidade: form.cidade.trim() || undefined,
      clientes: form.clientes,
      modos: form.modos,
      servidores: form.servidores,
      planos: form.planos,
    });
  };

  const field = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50";
  const label = "text-[11px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="font-display text-lg text-white">{initial ? "Editar revenda" : "Nova revenda"}</div>
                <div className="text-xs text-slate-400">Cadastro, servidores e planos com valores personalizados</div>
              </div>
              <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-12 gap-4 max-h-[75vh] overflow-y-auto">
              {/* Dados básicos */}
              <div className="col-span-12 md:col-span-6">
                <div className={label}><UserIcon className="h-3.5 w-3.5" /> Nome *</div>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={field} placeholder="Nome completo" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Cidade / UF</div>
                <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={field} placeholder="São Paulo · SP" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}><Mail className="h-3.5 w-3.5" /> Email *</div>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} placeholder="revenda@email.com" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}><Phone className="h-3.5 w-3.5" /> WhatsApp *</div>
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskWhats(e.target.value) })} className={field} placeholder="(11) 99999-9999" />
              </div>

              <div className="col-span-12">
                <div className={label}><Lock className="h-3.5 w-3.5" /> Senha forte *</div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className={`${field} pr-10`}
                    placeholder="Mín. 8 caracteres com maiúsc., minúsc., número e símbolo"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(strength / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-400 w-20 text-right">{form.senha ? strengthLabel : ""}</span>
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <div className={label}>Clientes ativos</div>
                <input type="number" min={0} value={form.clientes} onChange={(e) => setForm({ ...form, clientes: Math.max(0, Number(e.target.value) || 0) })} className={field} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Modos de cobrança *</div>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(modoMeta) as Modo[]).map((m) => {
                    const M = modoMeta[m];
                    const active = form.modos.includes(m);
                    return (
                      <button key={m} type="button" onClick={() => toggleModo(m)}
                        className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${active ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                        <M.icon className="h-3.5 w-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Servidores */}
              <div className="col-span-12 border-t border-white/5 pt-4 mt-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Servidores vinculados — valor por cliente</div>
                <div className="grid grid-cols-12 gap-2">
                  {SERVIDORES_DISPONIVEIS.map((nome) => {
                    const sel = form.servidores.find((s) => s.nome === nome);
                    return (
                      <div key={nome} className={`col-span-12 sm:col-span-6 flex items-center gap-2 px-3 py-2 rounded-lg border ${sel ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-white/[0.02]"}`}>
                        <button type="button" onClick={() => toggleServidor(nome)} className={`h-5 w-5 rounded grid place-items-center border ${sel ? "bg-amber-400 border-amber-400 text-black" : "border-white/20"}`}>
                          {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <span className="text-sm text-white flex-1">{nome}</span>
                        {sel && (
                          <MoneyInput
                            value={sel.valor}
                            onChange={(v) => setServValor(nome, v)}
                            className="w-28 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-400/50 text-right"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Planos */}
              <div className="col-span-12 border-t border-white/5 pt-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Planos contratados — valor personalizado</div>
                <div className="grid grid-cols-12 gap-2">
                  {PLANOS_DISPONIVEIS.map((p) => {
                    const sel = form.planos.find((x) => x.nome === p.nome);
                    return (
                      <div key={p.nome} className={`col-span-12 sm:col-span-6 flex items-center gap-2 px-3 py-2 rounded-lg border ${sel ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-white/[0.02]"}`}>
                        <button type="button" onClick={() => togglePlano(p.nome, p.padrao)} className={`h-5 w-5 rounded grid place-items-center border ${sel ? "bg-amber-400 border-amber-400 text-black" : "border-white/20"}`}>
                          {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <span className="text-sm text-white flex-1">
                          {p.nome} <span className="text-[10px] text-slate-500">· padrão {fmtBRL(p.padrao)}</span>
                        </span>
                        {sel && (
                          <MoneyInput
                            value={sel.valor}
                            onChange={(v) => setPlanoValor(p.nome, v)}
                            className="w-28 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-400/50 text-right"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/20">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5">
                Cancelar
              </button>
              <NeonButton onClick={submit}>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> {initial ? "Salvar alterações" : "Criar revenda"}
                </span>
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
