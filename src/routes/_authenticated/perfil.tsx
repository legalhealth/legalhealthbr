import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { User, Bell, Check, Save, LogOut, Loader2, Settings2, Crown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | Legal Health" },
      {
        name: "description",
        content: "Dados profissionais, assinatura e configurações da sua conta Legal Health.",
      },
      { property: "og:title", content: "Perfil | Legal Health" },
      {
        property: "og:description",
        content: "Dados profissionais, assinatura e configurações da sua conta Legal Health.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const PLANS = [
  {
    id: "essential",
    name: "Essential",
    price: "R$ 197",
    period: "/mês",
    description: "Médicos individuais e consultórios de menor porte",
    featured: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "R$ 497",
    period: "/mês",
    description: "Gama completa para clínicas integradas e equipes",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Grandes redes hospitalares e operadoras de saúde",
    featured: false,
  },
] as const;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${label} deve ter no máximo ${max} caracteres.` });

const profileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: "Informe seu nome completo (mínimo 3 caracteres)." })
    .max(120, { message: "Nome deve ter no máximo 120 caracteres." }),
  clinica: optionalText(150, "Clínica"),
  crm: optionalText(20, "CRM").refine(
    (v) => v === "" || /^[A-Za-z]{0,4}[\s/-]*[A-Za-z]{2}\s?\d{3,8}$/.test(v),
    { message: "Formato esperado: CRM/SP 123456." },
  ),
  especialidade: optionalText(100, "Especialidade"),
  cidade: optionalText(100, "Cidade"),
});

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [clinic, setClinic] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [plan, setPlan] = useState<string>("essential");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [preferences, setPreferences] = useState({
    push: true,
    biometria: false,
    offline: false,
    emailAlerts: true,
    weeklyDigest: false,
    newJurisprudence: true,
    riskNotifications: true,
  });

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "nome, clinica, crm, especialidade, cidade, plano, push, biometria, offline, email_alerts, weekly_digest, new_jurisprudence, risk_notifications",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return { userId, email: auth.user?.email ?? "", profile: data };
    },
  });

  useEffect(() => {
    const data = profileQuery.data;
    if (!data) return;
    setEmail(data.email);
    const p = data.profile;
    if (!p) return;
    setName(p.nome ?? "");
    setClinic(p.clinica ?? "");
    setCrm(p.crm ?? "");
    setSpecialty(p.especialidade ?? "");
    setCity(p.cidade ?? "");
    setPlan(p.plano ?? "essential");
    setPreferences({
      push: p.push,
      biometria: p.biometria,
      offline: p.offline,
      emailAlerts: p.email_alerts,
      weeklyDigest: p.weekly_digest,
      newJurisprudence: p.new_jurisprudence,
      riskNotifications: p.risk_notifications,
    });
  }, [profileQuery.data]);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LH";

  const toggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const userId = profileQuery.data?.userId;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          nome: values.nome || null,
          clinica: values.clinica || null,
          crm: values.crm || null,
          especialidade: values.especialidade || null,
          cidade: values.cidade || null,
          plano: plan,
          push: preferences.push,
          biometria: preferences.biometria,
          offline: preferences.offline,
          email_alerts: preferences.emailAlerts,
          weekly_digest: preferences.weeklyDigest,
          new_jurisprudence: preferences.newJurisprudence,
          risk_notifications: preferences.riskNotifications,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado", { description: "Seus dados foram salvos na sua conta." });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({
      nome: name,
      clinica: clinic,
      crm,
      especialidade: specialty,
      cidade: city,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Verifique os campos destacados");
      return;
    }
    setErrors({});
    saveMutation.mutate(parsed.data);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <PageShell
      title="Perfil"
      description="Dados profissionais, assinatura e configurações da sua conta."
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6 md:mt-10">
        <Card className="rounded-2xl glass-card shadow-none">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:items-center sm:text-left">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-gold/40 bg-background text-2xl font-medium tracking-widest text-gold">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="wordmark truncate text-xl text-foreground">
                {name.trim() || "Seu nome"}
              </p>
              <p className="truncate text-sm text-muted-foreground">{email || "—"}</p>
              <p className="mt-1 text-xs tracking-[0.18em] text-subtle uppercase">
                {specialty.trim() || "Especialidade não informada"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl glass-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <User className="h-5 w-5 text-gold" />
              Dados profissionais
            </CardTitle>
            <CardDescription>
              Informações usadas para personalizar análises e alertas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. João Silva"
                maxLength={120}
                aria-invalid={Boolean(errors["nome"])}
              />
              {errors["nome"] && <p className="text-xs text-danger">{errors["nome"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="crm">CRM/UF</Label>
              <Input
                id="crm"
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                placeholder="CRM/SP 123456"
                maxLength={20}
                aria-invalid={Boolean(errors["crm"])}
              />
              {errors["crm"] && <p className="text-xs text-danger">{errors["crm"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Cirurgia plástica, cardiologia, ortopedia..."
                maxLength={100}
                aria-invalid={Boolean(errors["especialidade"])}
              />
              {errors["especialidade"] && (
                <p className="text-xs text-danger">{errors["especialidade"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade/UF</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo, SP"
                maxLength={100}
                aria-invalid={Boolean(errors["cidade"])}
              />
              {errors["cidade"] && <p className="text-xs text-danger">{errors["cidade"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic">Clínica / Instituição</Label>
              <Input
                id="clinic"
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="Clínica Médica Exemplo"
                maxLength={150}
                aria-invalid={Boolean(errors["clinica"])}
              />
              {errors["clinica"] && <p className="text-xs text-danger">{errors["clinica"]}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">E-mail de acesso</Label>
              <Input id="email" type="email" value={email} readOnly disabled />
              <p className="text-xs text-subtle">O e-mail de acesso não pode ser alterado aqui.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl glass-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Crown className="h-5 w-5 text-gold" />
              Assinatura
            </CardTitle>
            <CardDescription>Escolha o plano adequado ao porte da sua operação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((item) => {
              const active = plan === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  aria-pressed={active}
                  className={`relative flex h-full flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                    active
                      ? "border-gold bg-gold/5"
                      : item.featured
                        ? "border-gold/40 bg-background hover:border-gold"
                        : "border-border bg-background hover:border-gold/40"
                  }`}
                >
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium tracking-wide ${item.featured ? "text-gold" : "text-foreground"}`}
                    >
                      {item.name}
                    </span>
                    {item.featured && !active ? (
                      <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.6rem] tracking-[0.16em] text-gold uppercase">
                        Recomendado
                      </span>
                    ) : null}
                    {active ? (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-success">
                        <Check className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : null}
                  </div>
                  <p className="text-2xl font-medium text-foreground">
                    {item.price}
                    <span className="text-sm font-normal text-muted-foreground">{item.period}</span>
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl glass-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Settings2 className="h-5 w-5 text-gold" />
              Configurações
            </CardTitle>
            <CardDescription>
              Preferências do aplicativo neste dispositivo e na conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PreferenceRow
              id="push"
              label="Notificações push"
              description="Avisos de prazos e riscos direto no seu celular."
              checked={preferences.push}
              onCheckedChange={() => toggle("push")}
            />
            <Separator className="bg-border" />
            <PreferenceRow
              id="biometria"
              label="Desbloqueio por biometria"
              description="Exigir digital ou reconhecimento facial ao abrir o app."
              checked={preferences.biometria}
              onCheckedChange={() => toggle("biometria")}
            />
            <Separator className="bg-border" />
            <PreferenceRow
              id="offline"
              label="Modo offline"
              description="Manter diagnóstico e plano disponíveis sem conexão."
              checked={preferences.offline}
              onCheckedChange={() => toggle("offline")}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl glass-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Bell className="h-5 w-5 text-gold" />
              Notificações por e-mail
            </CardTitle>
            <CardDescription>Escolha quais alertas você deseja receber.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PreferenceRow
              id="emailAlerts"
              label="Alertas por e-mail"
              description="Notificações sobre riscos jurídicos identificados."
              checked={preferences.emailAlerts}
              onCheckedChange={() => toggle("emailAlerts")}
            />
            <Separator className="bg-border" />
            <PreferenceRow
              id="weeklyDigest"
              label="Resumo semanal"
              description="Relatório consolidado de novidades e riscos da semana."
              checked={preferences.weeklyDigest}
              onCheckedChange={() => toggle("weeklyDigest")}
            />
            <Separator className="bg-border" />
            <PreferenceRow
              id="newJurisprudence"
              label="Novas jurisprudências"
              description="Atualizações relevantes para sua especialidade."
              checked={preferences.newJurisprudence}
              onCheckedChange={() => toggle("newJurisprudence")}
            />
            <Separator className="bg-border" />
            <PreferenceRow
              id="riskNotifications"
              label="Alertas de risco alto"
              description="Avisos imediatos quando a pontuação de risco for crítica."
              checked={preferences.riskNotifications}
              onCheckedChange={() => toggle("riskNotifications")}
            />
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Entrar no computador</CardTitle>
            <CardDescription>
              Libere o acesso à sua conta em um computador escaneando o QR-Code da tela de entrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full rounded-xl border-border hover:bg-accent hover:text-accent-foreground sm:w-auto"
            >
              <Link to="/entrar-no-pc">Escanear QR-Code</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            disabled={saveMutation.isPending || profileQuery.isLoading}
            className="h-11 flex-1 rounded-xl gold-gradient font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            className="h-11 rounded-xl border-danger/60 bg-transparent text-danger hover:bg-danger/10 hover:text-danger sm:w-56"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

function PreferenceRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-medium text-foreground">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
