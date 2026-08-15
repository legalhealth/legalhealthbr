import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Scale, Shield, FileCheck, AlertTriangle, BookOpen, Gavel, Info, ListChecks } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/juriscore")({
  head: () => ({
    meta: [
      { title: "Juriscore® | Legal Health" },
      { name: "description", content: "Índice de risco jurídico da sua prática médica, atualizado continuamente." },
      { property: "og:title", content: "Juriscore® | Legal Health" },
      { property: "og:description", content: "Índice de risco jurídico da sua prática médica, atualizado continuamente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const score = 78;
const scoreLabel = "Bom";
const scoreColor = "text-success";
const scoreStroke = "var(--color-success)";

const indicators = [
  {
  {
    id: "documentation",
    label: "Documentação médica",
    value: 86,
    status: "Bom",
    color: "text-success",
    stroke: "var(--color-success)",
    description: "Prontuários e registros seguem padrões adequados.",
  },
  {
    id: "processes",
    label: "Processos e protocolos",
    value: 62,
    status: "Médio",
    color: "text-warn",
    stroke: "var(--color-warn)",
    description: "Há gargalos em fluxos de consentimento e autorização.",
  },
  {
    id: "contracts",
    label: "Contratos e vínculos",
    value: 45,
    status: "Atenção",
    color: "text-danger",
    stroke: "var(--color-danger)",
    description: "Cláusulas de responsabilidade precisam ser revisadas.",
  },
  {
    id: "compliance",
    label: "Conformidade regulatória",
    value: 91,
    status: "Excelente",
    color: "text-success",
    stroke: "var(--color-success)",
    description: "LGPD, CREMESP e CFM estão alinhados.",
  },
];

function Page() {
  return (
    <PageShell
      title="Juriscore®"
      description="Índice de risco jurídico da sua prática médica, atualizado continuamente."
    >
      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* Painel principal de pontuação */}
        <Card className="border border-border bg-card rounded-2xl shadow-none lg:col-span-5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Scale className="h-5 w-5 text-gold" />
              Pontuação geral
            </CardTitle>
            <CardDescription>Última atualização: hoje, 06:00</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="relative h-56 w-56">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={scoreStroke}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52 * (score / 100)} ${2 * Math.PI * 52}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-serif font-medium tracking-tight ${scoreColor}`}>{score}</span>
                <span className="text-sm font-medium text-muted-foreground">de 100</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-success/10 text-success border-0">{scoreLabel}</Badge>
              <span className="text-sm text-muted-foreground">Risco jurídico moderado-baixo</span>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de risco */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card className="border border-border bg-card rounded-2xl shadow-none flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Shield className="h-5 w-5 text-gold" />
                Indicadores de risco
              </CardTitle>
              <CardDescription>Dimensões analisadas pela IA e pela equipe jurídica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {indicators.map((indicator) => (
                <div key={indicator.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{indicator.label}</span>
                      <span className={`text-xs font-medium ${indicator.color}`}>{indicator.status}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{indicator.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${indicator.value}%`, backgroundColor: indicator.stroke }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{indicator.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cartões explicativos */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border border-border bg-card rounded-2xl shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
                  <BookOpen className="h-4 w-4 text-gold" />
                  O que é o Juriscore®?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  O Juriscore® é um índice proprietário que mede a saúde jurídica da sua prática. Ele combina
                  análise documental, conformidade regulatória e padrões de processos clínicos.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card rounded-2xl shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
                  <Gavel className="h-4 w-4 text-gold" />
                  Como interpretar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Scores acima de 75 indicam boa proteção jurídica. Entre 50 e 75, há espaços para ajustes. Abaixo
                  de 50, recomendamos ação imediata para reduzir riscos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Aviso e recomendações */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border border-border bg-card rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <AlertTriangle className="h-5 w-5 text-warn" />
              Recomendações prioritárias
            </CardTitle>
            <CardDescription>Ações que mais impactam sua pontuação neste mês.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-danger" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Revisar cláusulas de responsabilidade</p>
                <p className="text-xs text-muted-foreground">Contratos de prestação de serviço médico</p>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-warn" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Padronizar termos de consentimento</p>
                <p className="text-xs text-muted-foreground">Procedimentos de maior risco e estética</p>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-success" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Manter atualização de registros médicos</p>
                <p className="text-xs text-muted-foreground">Prontuários eletrônicos e assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <Info className="h-5 w-5 text-gold" />
              Sobre os dados
            </CardTitle>
            <CardDescription>Como a pontuação é calculada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              O Juriscore® utiliza dados de três fontes: documentos e contratos enviados, bases públicas de
              jurisprudência e regulamentação do CFM/CREMESP, e informações de rotina inseridas na plataforma.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O índice é atualizado automaticamente sempre que há novas jurisprudências, mudanças regulatórias ou
              documentos processados pela IA.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <FileCheck className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Próxima atualização em 7 dias</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
