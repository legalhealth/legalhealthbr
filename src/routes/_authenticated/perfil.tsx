import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Building2, Bell, FileText, Shield, Save, LogOut } from "lucide-react";

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

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    newJurisprudence: true,
    riskNotifications: true,
  });

  const toggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Alterações salvas localmente", {
      description: "Em breve sincronizaremos com sua conta.",
    });
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
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. João Silva"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao.silva@clinica.com.br"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic">Clínica / Instituição</Label>
                <Input
                  id="clinic"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="Clínica Médica Exemplo"
                  maxLength={150}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  placeholder="CRM/SP 123456"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Cirurgia plástica, cardiologia, ortopedia..."
                  maxLength={100}
                />
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
                <span className="text-sm font-medium text-foreground">Profissional</span>
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
            className="w-full bg-gold text-primary-foreground hover:bg-gold/90 h-11 rounded-xl font-medium"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
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
