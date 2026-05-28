import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Banknote, CreditCard, Eye, EyeOff, KeyRound, QrCode, Save, ShieldCheck, Upload, UserRound } from "lucide-react";
import { useAppSession } from "@/contexts/AppSessionContext";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import {
  getCurrentProfile,
  updateCurrentPassword,
  updateCurrentProfile,
  uploadCurrentUserAvatar,
  type ProfileRow,
} from "@/services/bradox/auth";
import { fetchPaymentSettings, savePaymentSetting, type PaymentProviderSettingRow, type Provider } from "@/services/bradox/payments";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

type ProviderForm = {
  status: "active" | "inactive";
  displayName: string;
  publicConfig: Record<string, string>;
  privateConfig: Record<string, string>;
};

const providerMeta: Record<Provider, { title: string; description: string; icon: typeof CreditCard }> = {
  mercado_pago: { title: "Mercado Pago", description: "Credenciais para conciliar pagamentos, mantendo a fatura dentro do Bradox.", icon: CreditCard },
  updepix: { title: "UpdePix", description: "Integração Pix para emissão e consulta sem mandar o cliente para checkout externo.", icon: QrCode },
  manual: { title: "Manual", description: "Dados Pix usados para gerar copia e cola, QR Code e exigir comprovante.", icon: Banknote },
};

function Settings() {
  const { activeNetworkId } = useAppSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [settings, setSettings] = useState<PaymentProviderSettingRow[]>([]);
  const [activeTab, setActiveTab] = useState<"perfil" | "pagamentos" | "seguranca">("perfil");
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", avatarUrl: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState<Provider | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCurrentProfile(), fetchPaymentSettings(activeNetworkId)])
      .then(([profileData, settingData]) => {
        if (!active) return;
        setProfile(profileData);
        setProfileForm({
          fullName: profileData?.full_name ?? "",
          phone: profileData?.phone ?? "",
          avatarUrl: profileData?.avatar_url ?? "",
        });
        setSettings(settingData);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar configuracoes"));
    return () => { active = false; };
  }, [activeNetworkId]);

  const forms = useMemo(() => buildForms(settings), [settings]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const saved = await updateCurrentProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        avatarUrl: profileForm.avatarUrl || null,
      });
      setProfile(saved);
      toast.success("Perfil atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "Use um arquivo de ate 5 MB." });
      return;
    }
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadCurrentUserAvatar(file);
      const saved = await updateCurrentProfile({ fullName: profileForm.fullName, phone: profileForm.phone, avatarUrl: publicUrl });
      setProfile(saved);
      setProfileForm((current) => ({ ...current, avatarUrl: publicUrl }));
      toast.success("Avatar atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const savePassword = async () => {
    if (!isStrongPassword(passwordForm.password)) {
      toast.error("Use uma senha forte", { description: "Minimo de 8 caracteres, com maiuscula, minuscula, numero e simbolo." });
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error("As senhas nao conferem");
      return;
    }
    setSavingPassword(true);
    try {
      await updateCurrentPassword(passwordForm.password);
      setPasswordForm({ password: "", confirm: "" });
      toast.success("Senha alterada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel alterar a senha");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveProvider = async (provider: Provider, form: ProviderForm) => {
    const validationError = validateProviderForm(provider, form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(provider);
    try {
      const saved = await savePaymentSetting({
        provider,
        status: form.status,
        displayName: form.displayName.trim(),
        publicConfig: form.publicConfig,
        privateConfig: form.privateConfig,
      });
      setSettings((current) => [saved, ...current.filter((item) => item.provider !== provider)]);
      toast.success("Integracao salva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar integracao");
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Configuracoes"
        subtitle="Gerencie dados da conta, seguranca e integracoes de pagamento em um unico lugar."
      />

      <div className="mb-5 flex flex-wrap gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] p-1.5">
        <TabButton active={activeTab === "perfil"} onClick={() => setActiveTab("perfil")} icon={UserRound}>Perfil</TabButton>
        <TabButton active={activeTab === "pagamentos"} onClick={() => setActiveTab("pagamentos")} icon={CreditCard}>Pagamentos</TabButton>
        <TabButton active={activeTab === "seguranca"} onClick={() => setActiveTab("seguranca")} icon={ShieldCheck}>Seguranca</TabButton>
      </div>

      {activeTab === "perfil" && (
        <ProfileCard
          profile={profile}
          form={profileForm}
          setForm={setProfileForm}
          saving={savingProfile}
          uploading={uploadingAvatar}
          onSave={saveProfile}
          onAvatarSelected={uploadAvatar}
        />
      )}

      {activeTab === "pagamentos" && (
        <div className="grid gap-5">
          {(Object.keys(providerMeta) as Provider[]).map((provider) => (
            <ProviderCard
              key={provider}
              provider={provider}
              initial={forms[provider]}
              saving={saving === provider}
              onSave={saveProvider}
            />
          ))}
        </div>
      )}

      {activeTab === "seguranca" && (
        <SecurityCard
          form={passwordForm}
          setForm={setPasswordForm}
          saving={savingPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onSave={savePassword}
        />
      )}
    </>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof CreditCard; children: React.ReactNode }) {
  return (
    <button
      type="button"
      data-handled="true"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-sm font-medium transition ${active ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ProfileCard({
  profile,
  form,
  setForm,
  saving,
  uploading,
  onSave,
  onAvatarSelected,
}: {
  profile: ProfileRow | null;
  form: { fullName: string; phone: string; avatarUrl: string };
  setForm: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; avatarUrl: string }>>;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onAvatarSelected: (file: File | null) => void;
}) {
  const initials = getInitials(form.fullName || profile?.email || "U");
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Avatar</div>
          <div className="mt-5 flex flex-col items-center gap-4">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 text-3xl font-bold text-cyan-100">
              {form.avatarUrl ? <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : initials}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-4 text-sm text-white transition hover:bg-white/10">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Trocar avatar"}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => onAvatarSelected(event.target.files?.[0] ?? null)} />
            </label>
            <p className="text-center text-xs leading-5 text-slate-500">PNG, JPG, WEBP ou GIF ate 5 MB.</p>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Dados da conta</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className={inputClass} placeholder="Seu nome" />
            </Field>
            <Field label="WhatsApp">
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={inputClass} placeholder="(11) 99999-9999" />
            </Field>
            <Info label="E-mail" value={profile?.email} />
            <Info label="Funcao" value={profile?.role} />
            <Info label="Status" value={profile?.status} />
          </div>
          <div className="mt-5 flex justify-end">
            <NeonButton onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar perfil"}
            </NeonButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SecurityCard({
  form,
  setForm,
  saving,
  showPassword,
  onTogglePassword,
  onSave,
}: {
  form: { password: string; confirm: string };
  setForm: React.Dispatch<React.SetStateAction<{ password: string; confirm: string }>>;
  saving: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSave: () => void;
}) {
  const strong = isStrongPassword(form.password);
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-xl text-white">Trocar senha</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">A nova senha precisa ter maiuscula, minuscula, numero, simbolo e pelo menos 8 caracteres.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Nova senha">
          <PasswordInput value={form.password} show={showPassword} onToggle={onTogglePassword} onChange={(value) => setForm((current) => ({ ...current, password: value }))} />
        </Field>
        <Field label="Confirmar senha">
          <PasswordInput value={form.confirm} show={showPassword} onToggle={onTogglePassword} onChange={(value) => setForm((current) => ({ ...current, confirm: value }))} />
        </Field>
      </div>
      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${strong ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
        {strong ? "Senha forte detectada." : "Senha forte obrigatoria: use maiuscula, minuscula, numero e simbolo."}
      </div>
      <div className="mt-5 flex justify-end">
        <NeonButton onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Alterando..." : "Alterar senha"}
        </NeonButton>
      </div>
    </GlassCard>
  );
}

function ProviderCard({
  provider,
  initial,
  saving,
  onSave,
}: {
  provider: Provider;
  initial: ProviderForm;
  saving: boolean;
  onSave: (provider: Provider, form: ProviderForm) => Promise<void>;
}) {
  const meta = providerMeta[provider];
  const Icon = meta.icon;
  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  const updatePublic = (key: string, value: string) => setForm((current) => ({ ...current, publicConfig: { ...current.publicConfig, [key]: value } }));
  const updatePrivate = (key: string, value: string) => setForm((current) => ({ ...current, privateConfig: { ...current.privateConfig, [key]: value } }));

  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl text-white">{meta.title}</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">{meta.description}</p>
          </div>
        </div>
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProviderForm["status"] }))} className={inputClass}>
          <option className="bg-[#101317] text-white" value="inactive">Inativo</option>
          <option className="bg-[#101317] text-white" value="active">Ativo</option>
        </select>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Nome de exibicao">
          <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className={inputClass} />
        </Field>

        {provider === "manual" ? (
          <>
            <Field label="Tipo da chave Pix">
              <select value={form.publicConfig.pix_key_type || "email"} onChange={(event) => updatePublic("pix_key_type", event.target.value)} className={inputClass}>
                <option className="bg-[#101317] text-white" value="email">E-mail</option>
                <option className="bg-[#101317] text-white" value="cpf_cnpj">CPF/CNPJ</option>
                <option className="bg-[#101317] text-white" value="telefone">Telefone</option>
                <option className="bg-[#101317] text-white" value="aleatoria">Aleatoria</option>
              </select>
            </Field>
            <Field label="Chave Pix">
              <input value={form.publicConfig.pix_key || ""} onChange={(event) => updatePublic("pix_key", event.target.value)} className={inputClass} placeholder="pix@empresa.com" />
            </Field>
            <Field label="Nome do recebedor">
              <input value={form.publicConfig.receiver_name || ""} onChange={(event) => updatePublic("receiver_name", event.target.value)} className={inputClass} placeholder="BRAGA DIGITAL" />
            </Field>
            <Field label="Cidade do recebedor">
              <input value={form.publicConfig.receiver_city || ""} onChange={(event) => updatePublic("receiver_city", event.target.value)} className={inputClass} placeholder="SAO PAULO" />
            </Field>
            <Field label="Instrucao exibida na fatura">
              <textarea value={form.publicConfig.instructions || ""} onChange={(event) => updatePublic("instructions", event.target.value)} className={`${inputClass} min-h-24 md:col-span-2`} placeholder="Pague o Pix e envie o comprovante nesta pagina." />
            </Field>
          </>
        ) : provider === "mercado_pago" ? (
          <>
            <Field label="Public key">
              <input value={form.publicConfig.public_key || ""} onChange={(event) => updatePublic("public_key", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Access token">
              <SecretInput value={form.privateConfig.access_token || ""} onChange={(value) => updatePrivate("access_token", value)} />
            </Field>
            <Field label="Webhook secret">
              <SecretInput value={form.privateConfig.webhook_secret || ""} onChange={(value) => updatePrivate("webhook_secret", value)} />
            </Field>
          </>
        ) : (
          <>
            <Field label="API URL">
              <input value={form.publicConfig.api_url || ""} onChange={(event) => updatePublic("api_url", event.target.value)} className={inputClass} placeholder="https://..." />
            </Field>
            <Field label="API token">
              <SecretInput value={form.privateConfig.api_token || ""} onChange={(value) => updatePrivate("api_token", value)} />
            </Field>
            <Field label="Webhook secret">
              <SecretInput value={form.privateConfig.webhook_secret || ""} onChange={(value) => updatePrivate("webhook_secret", value)} />
            </Field>
          </>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <NeonButton onClick={() => onSave(provider, form)} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar integracao"}
        </NeonButton>
      </div>
    </GlassCard>
  );
}

function SecretInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input type="password" value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} pl-10`} autoComplete="new-password" />
    </div>
  );
}

function PasswordInput({
  value,
  show,
  onToggle,
  onChange,
}: {
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} pr-12`}
        autoComplete="new-password"
      />
      <button
        type="button"
        data-handled="true"
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

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
        {value || "Nao informado"}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function buildForms(settings: PaymentProviderSettingRow[]): Record<Provider, ProviderForm> {
  const defaults: Record<Provider, ProviderForm> = {
    mercado_pago: { status: "inactive", displayName: "Mercado Pago", publicConfig: {}, privateConfig: {} },
    updepix: { status: "inactive", displayName: "UpdePix", publicConfig: {}, privateConfig: {} },
    manual: {
      status: "inactive",
      displayName: "Pix manual",
      publicConfig: { pix_key_type: "email", receiver_city: "SAO PAULO", instructions: "Pague o Pix e envie o comprovante nesta pagina." },
      privateConfig: {},
    },
  };

  for (const setting of settings) {
    defaults[setting.provider] = {
      status: setting.status,
      displayName: setting.display_name,
      publicConfig: asRecord(setting.public_config),
      privateConfig: asRecord(setting.private_config),
    };
  }

  return defaults;
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item == null ? "" : String(item)]));
}

function validateProviderForm(provider: Provider, form: ProviderForm) {
  if (!form.displayName.trim()) return "Informe o nome de exibicao da integracao";

  if (form.status === "inactive") return null;

  if (provider === "manual") {
    if (!form.publicConfig.pix_key?.trim()) return "Informe a chave Pix para ativar o Manual";
    if (!form.publicConfig.receiver_name?.trim()) return "Informe o nome do recebedor para ativar o Manual";
    if (!form.publicConfig.receiver_city?.trim()) return "Informe a cidade do recebedor para ativar o Manual";
    return null;
  }

  if (provider === "mercado_pago") {
    if (!form.publicConfig.public_key?.trim()) return "Informe a Public key para ativar Mercado Pago";
    if (!form.privateConfig.access_token?.trim()) return "Informe o Access token para ativar Mercado Pago";
    return null;
  }

  if (!form.publicConfig.api_url?.trim()) return "Informe a API URL para ativar UpdePix";
  if (!form.privateConfig.api_token?.trim()) return "Informe o API token para ativar UpdePix";
  return null;
}

const inputClass = "h-11 w-full rounded-2xl border border-white/10 bg-[#101317] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50";
