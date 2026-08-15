import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PILLARS, getLevel, type Level, type PillarScore } from "@/lib/juriscore";

export type DiagnosticContext = {
  hasDiagnostic: boolean;
  score: number | null;
  level: Level | null;
  createdAt: string | null;
  pillars: PillarScore[];
  weakest: PillarScore[];
  especialidade: string | null;
  clinica: string | null;
  nome: string | null;
};

const EMPTY: DiagnosticContext = {
  hasDiagnostic: false,
  score: null,
  level: null,
  createdAt: null,
  pillars: [],
  weakest: [],
  especialidade: null,
  clinica: null,
  nome: null,
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

export async function fetchDiagnosticContext(): Promise<DiagnosticContext> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return EMPTY;

  const [profileRes, scoreRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, clinica, especialidade")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("juriscore_results")
      .select("score, by_pillar, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const result = scoreRes.data;
  const pillars = result ? toPillarScores(result.by_pillar) : [];

  return {
    hasDiagnostic: Boolean(result),
    score: result ? result.score : null,
    level: result ? getLevel(result.score) : null,
    createdAt: result?.created_at ?? null,
    pillars,
    weakest: [...pillars].sort((a, b) => a.percent - b.percent).slice(0, 2),
    especialidade: profile?.especialidade ?? null,
    clinica: profile?.clinica ?? null,
    nome: profile?.nome ?? null,
  };
}

export function useDiagnosticContext() {
  return useQuery({
    queryKey: ["diagnostic-context"],
    queryFn: fetchDiagnosticContext,
    staleTime: 60_000,
  });
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Bloco de contexto injetado nos prompts/análises das ferramentas de IA. */
export function contextSummary(ctx: DiagnosticContext | undefined): string {
  if (!ctx?.hasDiagnostic) {
    return "Contexto: nenhum diagnóstico Juriscore® registrado ainda.";
  }
  const weak = ctx.weakest.map((p) => `${p.name} (${p.percent}%)`).join(", ");
  const perfil = [ctx.especialidade, ctx.clinica].filter(Boolean).join(" · ");
  return [
    `Contexto do último diagnóstico (${formatDate(ctx.createdAt)}): Juriscore® ${ctx.score}/100 — nível ${ctx.level?.name}.`,
    `Pilares mais frágeis: ${weak}.`,
    perfil ? `Perfil: ${perfil}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
