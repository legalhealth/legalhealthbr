import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ANSWER_OPTIONS,
  MAX_POINTS,
  PILLARS,
  TOTAL_QUESTIONS,
  computePillarScores,
  computeScore,
  getLevel,
  pillarColor,
  pillarTextClass,
  type Answers,
  type AnswerValue,
} from "@/lib/juriscore";

export const Route = createFileRoute("/_authenticated/juriscore")({
  head: () => ({
    meta: [
      { title: "Juriscore® | Legal Health" },
      {
        name: "description",
        content: "Diagnóstico de risco jurídico em 5 pilares: responda 15 perguntas e receba seu Juriscore®.",
      },
      { property: "og:title", content: "Juriscore® | Legal Health" },
      {
        property: "og:description",
        content: "Diagnóstico de risco jurídico em 5 pilares: responda 15 perguntas e receba seu Juriscore®.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);

  const pillar = PILLARS[step]!;
  const pillarScores = useMemo(() => computePillarScores(answers), [answers]);
  const score = useMemo(() => computeScore(answers), [answers]);
  const level = getLevel(score);
  const answeredCount = Object.keys(answers).length;
  const pillarComplete = pillar.questions.every((q) => answers[q.key] !== undefined);
  const isLast = step === PILLARS.length - 1;

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      const byPillar = Object.fromEntries(computePillarScores(answers).map((p) => [p.id, p.percent]));
      const { error } = await supabase.from("juriscore_results").insert({
        user_id: userId,
        score: computeScore(answers),
        by_pillar: byPillar,
        answers,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFinished(true);
      toast.success("Juriscore® calculado", { description: "Resultado salvo no seu histórico." });
    },
    onError: (error) => {
      setFinished(true);
      toast.error("Resultado não foi salvo no histórico", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
      });
    },
  });

  const select = (key: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <PageShell title="Seu Juriscore®" description={`Diagnóstico concluído com ${TOTAL_QUESTIONS} respostas nos 5 pilares.`}>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="glass-card rounded-2xl shadow-none lg:col-span-1">
            <CardContent className="flex flex-col items-center gap-6 pt-6">
              <ScoreRing score={score} color={level.color} />
              <div className="text-center">
                <span
                  className="inline-flex items-center rounded-full border px-4 py-1 text-sm font-medium"
                  style={{ borderColor: level.color, color: level.color }}
                >
                  {level.name}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{level.phrase}</p>
              </div>
              <Separator className="bg-border" />
              <p className="text-xs text-subtle">
                {Object.values(answers).reduce<number>((s, v) => s + v, 0)} de {MAX_POINTS} pontos possíveis
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl shadow-none lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground">Equilíbrio entre os pilares</CardTitle>
              <CardDescription>Quanto mais preenchido o pentágono, maior a blindagem jurídica.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={pillarScores.map((p) => ({ pilar: p.name, valor: p.percent }))} outerRadius="72%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis
                    dataKey="pilar"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <Radar
                    dataKey="valor"
                    stroke="var(--color-gold)"
                    fill="var(--color-gold)"
                    fillOpacity={0.28}
                    strokeWidth={2}
                    dot
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl shadow-none lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-foreground">Conformidade por pilar</CardTitle>
              <CardDescription>Verde acima de 67%, âmbar entre 34% e 66%, vermelho abaixo de 34%.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {pillarScores.map((p) => (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.name}</span>
                    <span className={`font-medium ${pillarTextClass(p.percent)}`}>{p.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p.percent}%`, backgroundColor: pillarColor(p.percent) }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={restart}
            className="h-11 rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Refazer diagnóstico
          </Button>
          <Button
            onClick={() => navigate({ to: "/plano" })}
            className="h-11 flex-1 rounded-xl bg-gold font-medium text-primary-foreground hover:bg-gold/90"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Plano de Ação a partir deste Juriscore®
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Juriscore®"
      description="Diagnóstico de risco jurídico em 5 pilares, com 3 perguntas cada. Responda com sinceridade — o resultado orienta seu Plano de Ação."
    >
      <div className="mt-10 max-w-3xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Pilar {step + 1} de {PILLARS.length}
            </span>
            <span>
              {answeredCount}/{TOTAL_QUESTIONS} respostas
            </span>
          </div>
          <div className="flex gap-2">
            {PILLARS.map((p, index) => {
              const done = p.questions.every((q) => answers[q.key] !== undefined);
              return (
                <div key={p.id} className="flex-1 space-y-2">
                  <div
                    className={`h-1 rounded-full transition-colors ${
                      index === step ? "bg-gold" : done ? "bg-gold/50" : "bg-border"
                    }`}
                  />
                  <span
                    className={`hidden text-[11px] uppercase tracking-wider sm:block ${
                      index === step ? "text-gold" : "text-subtle"
                    }`}
                  >
                    {p.short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="glass-card rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-gold">Pilar {step + 1}</span>
            <CardTitle className="text-xl font-medium text-foreground">{pillar.name}</CardTitle>
            <CardDescription>{pillar.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {pillar.questions.map((question, index) => (
              <div key={question.key} className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="mr-2 text-subtle">{index + 1}.</span>
                  {question.text}
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ANSWER_OPTIONS.map((option) => {
                    const active = answers[question.key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => select(question.key, option.value)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          active
                            ? "border-gold bg-gold/10 text-foreground"
                            : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
                        }`}
                      >
                        {option.label}
                        {active ? <Check className="h-4 w-4 shrink-0 text-gold" /> : null}
                      </button>
                    );
                  })}
                </div>
                {index < pillar.questions.length - 1 ? <Separator className="bg-border" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 0 || save.isPending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="h-11 rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          {isLast ? (
            <Button
              disabled={!pillarComplete || save.isPending}
              onClick={() => save.mutate()}
              className="h-11 rounded-xl bg-gold font-medium text-primary-foreground hover:bg-gold/90"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Calcular meu Juriscore®
            </Button>
          ) : (
            <Button
              disabled={!pillarComplete}
              onClick={() => setStep((s) => Math.min(PILLARS.length - 1, s + 1))}
              className="h-11 rounded-xl bg-gold font-medium text-primary-foreground hover:bg-gold/90"
            >
              Próximo pilar
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!pillarComplete ? (
          <p className="mt-3 text-right text-xs text-subtle">Responda as 3 perguntas deste pilar para avançar.</p>
        ) : null}
      </div>
    </PageShell>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-[220px] w-[220px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="jsRingGradientLg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4B87A" />
            <stop offset="100%" stopColor="#B8975A" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#jsRingGradientLg)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-[cubic-bezier(0.22,0.61,0.36,1)] [filter:drop-shadow(0_0_10px_rgba(200,169,106,0.35))]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-normal tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-2 text-[0.68rem] uppercase tracking-[0.3em] text-subtle">de 100</span>
      </div>
    </div>
  );
}
