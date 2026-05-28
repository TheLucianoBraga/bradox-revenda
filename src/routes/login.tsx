import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Particles } from "@/components/Particles";
import { requestAccess, signInWithEmail } from "@/services/bradox/auth";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "login" | "request";
type RequestRole = "cliente" | "revenda";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RequestRole>("cliente");
  const [networkName, setNetworkName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Login page is explicitly a switch-account entrypoint.
    void supabase.auth.signOut({ scope: "local" });
  }, []);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Login realizado");
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel entrar";
      setLoginError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isStrongPassword(password)) {
      toast.error("Use uma senha forte", { description: "Minimo de 8 caracteres, com maiuscula, minuscula, numero e simbolo." });
      return;
    }
    setLoading(true);
    try {
      await requestAccess({ fullName, email, password, phone, role, networkName });
      toast.success(role === "revenda" ? "Cadastro enviado para aprovacao" : "Cadastro criado");
      setMode("login");
      setPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel solicitar acesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none fixed inset-0"><Particles density={60} /></div>

      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative flex items-center gap-3">
          <img src="/bradox-play-logo.png" alt="Bradox Play" className="h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(214,168,79,0.28)]" />
          <div>
            <div className="font-display tracking-widest">BRADOX PLAY</div>
            <div className="text-[10px] tracking-[0.3em] text-slate-400">TV ONLINE CONTROL</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05]">
            Operacao real,<br /><span className="text-gradient">sem dados de vitrine.</span>
          </h1>
          <p className="mt-5 text-slate-400 max-w-md">Entre com sua conta aprovada ou solicite acesso. Revendas precisam informar o nome da rede antes da aprovacao.</p>
        </div>

        <div className="relative text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Acesso protegido por Supabase Auth
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6 lg:min-h-0 lg:p-12">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-strong rounded-3xl p-8 border-gradient relative">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 mb-6">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-lg py-2 text-sm ${mode === "login" ? "bg-cyan-400 text-black" : "text-slate-300"}`}>Entrar</button>
            <button type="button" onClick={() => setMode("request")} className={`flex-1 rounded-lg py-2 text-sm ${mode === "request" ? "bg-cyan-400 text-black" : "text-slate-300"}`}>Solicitar acesso</button>
          </div>

          <div className="text-[10px] tracking-[0.3em] text-cyan-300/80 uppercase">{mode === "login" ? "Bem-vindo" : "Novo acesso"}</div>
          <h2 className="font-display text-3xl mt-1">{mode === "login" ? "Entrar no sistema" : "Cadastrar usuario"}</h2>
          <p className="text-sm text-slate-400 mt-2">
            {mode === "login" ? "Use seu e-mail e senha cadastrados." : "Revendas serao avaliadas; a rede nasce automaticamente na aprovacao."}
          </p>

          {mode === "login" ? (
            <form className="mt-6 space-y-4" onSubmit={submitLogin}>
              <Field label="E-mail">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} autoComplete="email" />
              </Field>
              <Field label="Senha">
                <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((current) => !current)} autoComplete="current-password" />
              </Field>
              {loginError && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
                  {loginError}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-medium glow-cyan disabled:opacity-60">
                {loading ? "Entrando..." : "Entrar no painel"}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submitRequest}>
              <Field label="Nome completo">
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required className={inputClass} autoComplete="name" />
              </Field>
              <Field label="E-mail">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} autoComplete="email" />
              </Field>
              <Field label="WhatsApp">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} autoComplete="tel" />
              </Field>
              <Field label="Tipo de usuario">
                <select value={role} onChange={(event) => setRole(event.target.value as RequestRole)} className={inputClass}>
                  <option className="bg-[#101317] text-white" value="cliente">Cliente</option>
                  <option className="bg-[#101317] text-white" value="revenda">Revenda</option>
                </select>
              </Field>
              {role === "revenda" && (
                <Field label="Nome da rede *">
                  <input value={networkName} onChange={(event) => setNetworkName(event.target.value)} required className={inputClass} placeholder="Nome que sera usado ao aprovar" />
                </Field>
              )}
              <Field label="Senha">
                <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((current) => !current)} autoComplete="new-password" />
                <div className="mt-2 text-[11px] leading-5 text-slate-400">
                  Minimo de 8 caracteres, com maiuscula, minuscula, numero e simbolo.
                </div>
              </Field>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 text-black font-medium glow-cyan disabled:opacity-60">
                {loading ? "Enviando..." : "Solicitar acesso"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={8}
        className={`${inputClass} pr-12`}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-cyan-200"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function isStrongPassword(value: string) {
  return /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value) && value.length >= 8;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass = "w-full px-4 py-3 rounded-xl bg-[#101317] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm text-white placeholder:text-slate-500";
