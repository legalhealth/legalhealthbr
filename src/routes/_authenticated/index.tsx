import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  FileSignature,
  Info,
  MessageSquare,
  ScanLine,
  ScrollText,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PILLARS,
  getLevel,
  pillarTextClass,
  type PillarScore,
} from "@/lib/juriscore";
import {
  daysUntil,
  pillarProgress,
  riscoMeta,
  usePlanReminders,
  type PillarProgress,
  type Prioridade,
} from "@/lib/plano";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início | Legal Health" },
      {
        name: "description",
        content:
          "Painel de inteligência jurídica: seu Juriscore®, alertas de risco e ações rápidas para proteger sua prática médica.",
      },
      { property: "og:title", content: "Início | Legal Health" },
      {
        property: "og:description",
        content:
          "Painel de inteligência jurídica: seu Juriscore®, alertas de risco e ações rápidas para proteger sua prática médica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type DashboardData = {
  nome: string | null;
  score: number | null;
  pillars: PillarScore[];
  hasPlan: boolean;
  itemsDone: number;
  itemsTotal: number;
  planPillars: PillarProgress[];
};

function toPillarScores(byPillar: unknown): PillarScore[] {
  if (!byPillar || typeof byPillar !== "object") return [];
  const raw = byPillar as Record<string, unknown>;
  return PILLARS.map((pillar) => {
    const percent = Number(raw[pillar.id] ?? 0);
    return {
      id: pillar.id,
      name: pillar.name,
      points: 0,
      max: pillar.questions.length * 2,
      percent: Number.isFinite(percent) ? Math.round(percent) : 0,
    };
  });
}

async function fetchDashboard(): Promise<DashboardData> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      nome: null,
      score: null,
      pillars: [],
      hasPlan: false,
      itemsDone: 0,
      itemsTotal: 0,
      planPillars: [],
    };
  }

  const [profileRes, scoreRes] = await Promise.all([
    supabase.from("profiles").select("nome").eq("user_id", userId).maybeSingle(),
    supabase
      .from("juriscore_results")
      .select("score, by_pillar")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: plan } = await supabase
    .from("action_plans")
    .select("id, prioridades")
    .eq("user_id", userId)
    .eq("status", "ativo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let itemsDone = 0;
  let itemsTotal = 0;
  const prioridades: Prioridade[] = [];
  if (Array.isArray(plan?.prioridades)) {
    for (const entry of plan.prioridades) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      const acoes = Array.isArray(item['acoes']) ? item['acoes'].map((a) => String(a)) : [];
      itemsTotal += acoes.length;
      prioridades.push({
        titulo: String(item['titulo'] ?? "Ação preventiva"),
        pilar: String(item['pilar'] ?? "Documental"),
        risco: (["alto", "medio", "baixo"].includes(String(item['risco']))
          ? String(item['risco'])
          : "medio") as Prioridade["risco"],
        prazo: String(item['prazo'] ?? "30 dias"),
        acoes,
      });
    }
  }

  let doneKeys: string[] = [];
  if (plan?.id) {
    const { data: items } = await supabase
      .from("action_items_done")
      .select("item_key, done")
      .eq("plan_id", plan.id);
    doneKeys = (items ?? []).filter((item) => item.done).map((item) => item.item_key);
    itemsDone = doneKeys.length;
    if (itemsTotal === 0) itemsTotal = (items ?? []).length;
  }

  return {
    nome: profileRes.data?.nome ?? null,
    score: scoreRes.data ? scoreRes.data.score : null,
    pillars: scoreRes.data ? toPillarScores(scoreRes.data.by_pillar) : [],
    hasPlan: Boolean(plan?.id),
    itemsDone,
    itemsTotal,
    planPillars: pillarProgress(prioridades, doneKeys),
  };
}

type AlertItem = {
  key: string;
  tone: "danger" | "warn" | "gold" | "info";
  title: string;
  description: string;
  cta: string;
  to: "/juriscore" | "/plano";
  priority: number;
};

const TONE: Record<AlertItem["tone"], { border: string; bg: string; text: string; button: string }> = {
  danger: {
    border: "border-danger/40",
    bg: "bg-danger/10",
    text: "text-danger",
    button: "border-danger/40 text-danger hover:bg-danger/10",
  },
  warn: {
    border: "border-warn/40",
    bg: "bg-warn/10",
    text: "text-warn",
    button: "border-warn/40 text-warn hover:bg-warn/10",
  },
  gold: {
    border: "border-gold/40",
    bg: "bg-gold/10",
    text: "text-gold",
    button: "border-gold/40 text-gold hover:bg-gold/10",
  },
  info: {
    border: "border-info/40",
    bg: "bg-info/10",
    text: "text-info",
    button: "border-info/40 text-info hover:bg-info/10",
  },
};

function buildAlerts(data: DashboardData): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (data.score === null) {
    alerts.push({
      key: "sem-diagnostico",
      tone: "info",
      title: "Diagnóstico pendente",
      description: "Descubra seu Juriscore® para ativar alertas personalizados.",
      cta: "Fazer diagnóstico",
      to: "/juriscore",
      priority: 1,
    });
    return alerts;
  }

  for (const pillar of data.pillars) {
    if (pillar.percent < 50) {
      alerts.push({
        key: `pilar-${pillar.id}`,
        tone: pillar.percent < 34 ? "danger" : "warn",
        title: `Pilar ${pillar.name} em ${pillar.percent}%`,
        description:
          pillar.percent < 34
            ? "Risco alto: lacunas estruturais neste pilar exigem ação imediata."
            : "Risco médio: conformidade parcial, com pontos a corrigir neste pilar.",
        cta: "Ver plano",
        to: "/plano",
        priority: pillar.percent < 34 ? 0 : 2,
      });
    }
  }

  if (!data.hasPlan) {
    alerts.push({
      key: "sem-plano",
      tone: "gold",
      title: "Plano de Ação não gerado",
      description: "Transforme seu diagnóstico em prioridades práticas com prazos.",
      cta: "Gerar plano",
      to: "/plano",
      priority: 3,
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

const QUICK_ACTIONS = [
  {
    title: "Nova peça",
    description: "Defesa, petição, notificação",
    icon: FileSignature,
    to: "/ia/peca",
  },
  {
    title: "Analisar intimação",
    description: "Riscos, prazos e estratégia",
    icon: ScrollText,
    to: "/ia/risco",
  },
  {
    title: "Escanear documento",
    description: "Upload e OCR",
    icon: ScanLine,
    to: "/ia/documentos",
  },
  {
    title: "Perguntar à IA",
    description: "Dúvidas do dia a dia clínico",
    icon: MessageSquare,
    to: "/ia/assistente",
  },
] as const;

function ScoreRing({ score }: { score: number | null }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const level = score === null ? null : getLevel(score);
  const progress = score === null ? 0 : (score / 100) * circumference;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="dashRingGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4B87A" />
            <stop offset="100%" stopColor="#B8975A" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        {score !== null ? (
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="url(#dashRingGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-1000 ease-[cubic-bezier(0.22,0.61,0.36,1)] [filter:drop-shadow(0_0_8px_rgba(200,169,106,0.35))]"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score === null ? (
          <span className="font-display text-4xl text-subtle">—</span>
        ) : (
          <>
            <span className="font-display text-5xl leading-none" style={{ color: level!.color }}>
              {score}
            </span>
            <span className="mt-2 text-[0.62rem] tracking-[0.3em] text-subtle">DE 100</span>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-gold/30 md:p-7">
      <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">{label}</p>
      <p className={`mt-4 font-display text-3xl leading-none ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const { data: reminders } = usePlanReminders();

  const firstName = data?.nome?.trim().split(/\s+/)[0] ?? null;
  const score = data?.score ?? null;
  const level = score === null ? null : getLevel(score);
  const pillarsInAlert = (data?.pillars ?? []).filter((p) => p.percent < 50).length;
  const alerts = data ? buildAlerts(data) : [];
  const upcoming = (reminders ?? []).filter((r) => daysUntil(r.due_date) <= 7).slice(0, 4);
  const planPillars = data?.planPillars ?? [];

  return (
    <PageShell title={firstName ? `Bem-vindo(a) de volta, ${firstName}` : "Bem-vindo(a) de volta"}>
      {isLoading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Cartão principal */}
          <section className="rounded-2xl glass-card p-6 md:p-8">
            <div className="flex flex-col items-center gap-7 text-center md:flex-row md:items-center md:gap-10 md:text-left">
              <ScoreRing score={score} />
              <div className="flex-1">
                <p className="text-[0.7rem] tracking-[0.22em] text-subtle uppercase">Juriscore®</p>
                {score === null ? (
                  <>
                    <h2 className="mt-3 font-display text-2xl text-foreground md:text-3xl">
                      Seu raio-x jurídico ainda não foi calculado
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      Responda 15 perguntas nos 5 pilares e receba o diagnóstico completo da sua
                      exposição jurídica.
                    </p>
                    <Button asChild className="mt-6 gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105">
                      <Link to="/juriscore">
                        <Sparkles className="h-4 w-4" />
                        Descobrir meu Juriscore®
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mt-3 flex justify-center md:justify-start">
                      <span
                        className={`rounded-full border px-4 py-1.5 text-xs tracking-[0.12em] uppercase ${level!.className}`}
                        style={{ borderColor: level!.color }}
                      >
                        {level!.name}
                      </span>
                    </div>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {level!.phrase}
                    </p>
                    <Link
                      to="/juriscore"
                      className="mt-6 inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-light"
                    >
                      Ver diagnóstico completo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Indicadores */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Score Jurídico"
              value={score === null ? "—" : String(score)}
              valueClass={level ? level.className : "text-subtle"}
            />
            <Metric
              label="Pilares em alerta"
              value={score === null ? "—" : String(pillarsInAlert)}
              valueClass={
                score === null
                  ? "text-subtle"
                  : pillarsInAlert === 0
                    ? "text-success"
                    : "text-warn"
              }
            />
            <div className="rounded-2xl glass-card p-5">
              <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">Pendências</p>
              <p
                className={`mt-3 font-display text-3xl leading-none ${data?.hasPlan ? "text-foreground" : "text-subtle"}`}
              >
                {data?.hasPlan ? `${data.itemsDone}/${data.itemsTotal}` : "—"}
              </p>
              <Link
                to="/plano"
                className="mt-4 inline-flex items-center gap-2 text-xs text-gold transition-colors hover:text-gold-light"
              >
                {data?.hasPlan ? "Revisar plano de ação" : "Gerar plano de ação"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          {/* Central de alertas */}
          <section>
            <h2 className="font-display text-xl text-foreground">Central de alertas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerada automaticamente a partir do seu diagnóstico e do seu plano de ação.
            </p>

            {upcoming.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-warn/40 bg-warn/10 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-warn">
                  <BellRing className="h-4 w-4" />
                  Prazos vencendo
                </p>
                <ul className="mt-3 space-y-2">
                  {upcoming.map((reminder) => {
                    const left = daysUntil(reminder.due_date);
                    return (
                      <li
                        key={reminder.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {reminder.titulo}
                        </span>
                        <span className={left <= 1 ? "text-xs text-danger" : "text-xs text-warn"}>
                          {left <= 0 ? "vence hoje" : left === 1 ? "vence amanhã" : `em ${left} dias`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/plano"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-gold transition-colors hover:text-gold-light"
                >
                  Ver prioridades
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-sm text-success">
                    Nenhum alerta crítico. Mantenha o monitoramento ativo.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const tone = TONE[alert.tone];
                  const Icon = alert.tone === "info" ? Info : alert.tone === "gold" ? Sparkles : AlertTriangle;
                  return (
                    <div
                      key={alert.key}
                      className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${tone.border} ${tone.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.text}`} />
                        <div>
                          <p className={`text-sm font-medium ${tone.text}`}>{alert.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className={`shrink-0 bg-transparent ${tone.button}`}
                      >
                        <Link to={alert.to}>{alert.cta}</Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Andamento do plano por pilar */}
          {data?.hasPlan && planPillars.length > 0 ? (
            <section>
              <h2 className="font-display text-xl text-foreground">Andamento do plano por pilar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.itemsDone} de {data.itemsTotal} ações concluídas ·{" "}
                {data.itemsTotal - data.itemsDone} pendentes.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {planPillars.map((pillar) => {
                  const meta = riscoMeta(pillar.risco);
                  return (
                    <div
                      key={pillar.pilar}
                      className="rounded-2xl glass-card p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-foreground">Pilar {pillar.pilar}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {pillar.done} concluídas · {pillar.pending} pendentes
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] ${meta.className}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pillar.percent === 100 ? "bg-success" : "bg-gold"}`}
                          style={{ width: `${pillar.percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-right text-xs text-subtle">{pillar.percent}%</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Ações rápidas */}
          <section>
            <h2 className="font-display text-xl text-foreground">Ações rápidas</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  to={action.to}
                  className="group rounded-2xl glass-card p-5 transition-colors hover:border-gold/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
                    <action.icon className="h-5 w-5 text-gold" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground transition-colors group-hover:text-gold-light">
                    {action.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Frase institucional */}
          <section className="rounded-2xl glass-card px-6 py-10 text-center md:py-14">
            <p className="mx-auto max-w-2xl font-display text-xl leading-relaxed text-foreground md:text-2xl">
              Não somos um escritório.{" "}
              <span className="text-gold">
                Somos a estrutura que antecipa, previne e protege.
              </span>
            </p>
          </section>
        </div>
      )}
    </PageShell>
  );
}