import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { User, Building2, Bell, FileText, Shield, Save, LogOut, Upload, Trash2, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | Legal Health" },
      { name: "description", content: "Dados profissionais, especialidade e configurações da sua conta." },
      { property: "og:title", content: "Perfil | Legal Health" },
      { property: "og:description", content: "Dados profissionais, especialidade e configurações da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [preferences, setPreferences] = useState({
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
          "nome, clinica, crm, especialidade, cidade, plano, email_alerts, weekly_digest, new_jurisprudence, risk_notifications",
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
    setPreferences({
      emailAlerts: p.email_alerts,
      weeklyDigest: p.weekly_digest,
      newJurisprudence: p.new_jurisprudence,
      riskNotifications: p.risk_notifications,
    });
  }, [profileQuery.data]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", { description: "Envie uma imagem PNG, JPG ou WEBP." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "O limite é de 3 MB." });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarName(file.name);
  };

  const removeAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            nome: values.nome || null,
            clinica: values.clinica || null,
            crm: values.crm || null,
            especialidade: values.especialidade || null,
            cidade: values.cidade || null,
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
      description="Dados profissionais, especialidade e configurações da sua conta."
    >
      <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                <User className="h-5 w-5 text-gold" />
                Dados profissionais
              </CardTitle>
              <CardDescription>Informações usadas para personalizar análises e alertas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
                <Avatar className="h-16 w-16 border border-border">
                  {avatarPreview ? <AvatarImage src={avatarPreview} alt="Pré-visualização do avatar" /> : null}
                  <AvatarFallback className="bg-card text-sm font-medium text-gold">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {avatarName
                      ? `${avatarName} — pré-visualização. Clique em salvar para confirmar.`
                      : "PNG, JPG ou WEBP de até 3 MB."}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <input
                    ref={fileInputRef}
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    {avatarPreview ? "Trocar" : "Enviar foto"}
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAvatar}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="joao.silva@clinica.com.br"
                  readOnly
                  disabled
                />
                <p className="text-xs text-subtle">O e-mail de acesso não pode ser alterado aqui.</p>
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
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
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
                {errors["especialidade"] && <p className="text-xs text-danger">{errors["especialidade"]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
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
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Bell className="h-5 w-5 text-gold" />
                Preferências de notificação
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
        </div>

        <div className="space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Building2 className="h-5 w-5 text-gold" />
                Plano atual
              </CardTitle>
              <CardDescription>Visão geral da sua assinatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plano</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {profileQuery.data?.profile?.plano ?? "essential"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  Ativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Renovação</span>
                <span className="text-sm text-foreground">15/09/2026</span>
              </div>
              <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground">
                Gerenciar plano
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Shield className="h-5 w-5 text-gold" />
                Segurança
              </CardTitle>
              <CardDescription>Gerencie o acesso à sua conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground">
                Alterar senha
              </Button>
              <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground">
                <FileText className="h-4 w-4" />
                Exportar meus dados
              </Button>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saveMutation.isPending || profileQuery.isLoading}
            className="w-full bg-gold text-primary-foreground hover:bg-gold/90 h-11 rounded-xl font-medium"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground h-11 rounded-xl"
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
