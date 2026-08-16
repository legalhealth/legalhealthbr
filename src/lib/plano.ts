import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Risco = "alto" | "medio" | "baixo";

export type Fonte = {
  norma: string;
  dispositivo: string;
  descricao: string;
};

export type Prioridade = {
  titulo: string;
  pilar: string;
  risco: Risco;
  prazo: string;
  prazo_dias?: number;
  due_date?: string;
  acoes: string[];
  fontes?: Fonte[];
};

export type ActionPlan = {
  id: string;
  resumo: string | null;
  prioridades: Prioridade[];
  created_at: string;
  versao: number;
  status: string;
};

export const RISCO_META: Record<Risco, { label: string; className: string }> = {
  alto: { label: "Risco alto", className: "border-danger/40 bg-danger/10 text-danger" },
  medio: { label: "Risco médio", className: "border-warn/40 bg-warn/10 text-warn" },
  baixo: { label: "Risco baixo", className: "border-success/40 bg-success/10 text-success" },
};

export function riscoMeta(risco: string) {
  return RISCO_META[(risco as Risco) in RISCO_META ? (risco as Risco) : "medio"];
}

export function itemKey(priorityIndex: number, actionIndex: number): string {
  return `p${priorityIndex}-a${actionIndex}`;
}

function parsePrioridades(raw: unknown): Prioridade[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const dias = Number(item['prazo_dias']);
      const fontes = Array.isArray(item['fontes'])
        ? item['fontes']
            .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
            .map((f) => ({
              norma: String(f['norma'] ?? "").trim(),
              dispositivo: String(f['dispositivo'] ?? "").trim(),
              descricao: String(f['descricao'] ?? "").trim(),
            }))
            .filter((f) => f.norma.length > 0)
        : [];
      return {
        titulo: String(item['titulo'] ?? "Ação preventiva"),
        pilar: String(item['pilar'] ?? "Documental"),
        risco: (["alto", "medio", "baixo"].includes(String(item['risco']))
          ? String(item['risco'])
          : "medio") as Risco,
        prazo: String(item['prazo'] ?? "30 dias"),
        ...(Number.isFinite(dias) && dias > 0 ? { prazo_dias: dias } : {}),
        ...(typeof item['due_date'] === "string" ? { due_date: item['due_date'] } : {}),
        acoes: Array.isArray(item['acoes']) ? item['acoes'].map((a) => String(a)) : [],
        ...(fontes.length > 0 ? { fontes } : {}),
      } satisfies Prioridade;
    });
}

/** Resumo de andamento agrupado por pilar (para o Dashboard). */
export type PillarProgress = {
  pilar: string;
  total: number;
  done: number;
  pending: number;
  percent: number;
  risco: Risco;
};

export function pillarProgress(
  prioridades: Prioridade[],
  doneKeys: Iterable<string>,
): PillarProgress[] {
  const doneSet = new Set(doneKeys);
  const map = new Map<string, PillarProgress>();
  prioridades.forEach((prioridade, pIndex) => {
    const current =
      map.get(prioridade.pilar) ??
      ({
        pilar: prioridade.pilar,
        total: 0,
        done: 0,
        pending: 0,
        percent: 0,
        risco: "baixo" as Risco,
      } satisfies PillarProgress);
    prioridade.acoes.forEach((_, aIndex) => {
      current.total += 1;
      if (doneSet.has(itemKey(pIndex, aIndex))) current.done += 1;
    });
    const weight: Record<Risco, number> = { baixo: 0, medio: 1, alto: 2 };
    if (weight[prioridade.risco] > weight[current.risco]) current.risco = prioridade.risco;
    current.pending = current.total - current.done;
    current.percent = current.total === 0 ? 0 : Math.round((current.done / current.total) * 100);
    map.set(prioridade.pilar, current);
  });
  return [...map.values()];
}

export function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export type PlanState = {
  hasDiagnostic: boolean;
  resultId: string | null;
  score: number | null;
  plan: ActionPlan | null;
  doneKeys: string[];
};

export function usePlanState() {
  return useQuery({
    queryKey: ["action-plan"],
    queryFn: async (): Promise<PlanState> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      const empty: PlanState = {
        hasDiagnostic: false,
        resultId: null,
        score: null,
        plan: null,
        doneKeys: [],
      };
      if (!userId) return empty;

      const { data: result } = await supabase
        .from("juriscore_results")
        .select("id, score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!result) return empty;

      const { data: planRow } = await supabase
        .from("action_plans")
        .select("id, resumo, prioridades, created_at, versao, status")
        .eq("user_id", userId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let doneKeys: string[] = [];
      if (planRow?.id) {
        const { data: items } = await supabase
          .from("action_items_done")
          .select("item_key, done")
          .eq("plan_id", planRow.id);
        doneKeys = (items ?? []).filter((i) => i.done).map((i) => i.item_key);
      }

      return {
        hasDiagnostic: true,
        resultId: result.id,
        score: result.score,
        plan: planRow
          ? {
              id: planRow.id,
              resumo: planRow.resumo,
              prioridades: parsePrioridades(planRow.prioridades),
              created_at: planRow.created_at,
              versao: planRow.versao,
              status: planRow.status,
            }
          : null,
        doneKeys,
      };
    },
  });
}

/** Histórico de versões do plano (mais recente primeiro). */
export function usePlanVersions() {
  return useQuery({
    queryKey: ["action-plan-versions"],
    queryFn: async (): Promise<ActionPlan[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data } = await supabase
        .from("action_plans")
        .select("id, resumo, prioridades, created_at, versao, status")
        .eq("user_id", userId)
        .order("versao", { ascending: false });
      return (data ?? []).map((row) => ({
        id: row.id,
        resumo: row.resumo,
        prioridades: parsePrioridades(row.prioridades),
        created_at: row.created_at,
        versao: row.versao,
        status: row.status,
      }));
    },
  });
}

export type PlanDiff = {
  novas: string[];
  removidas: string[];
  mantidas: string[];
};

export function diffPlans(anterior: ActionPlan, atual: ActionPlan): PlanDiff {
  const before = anterior.prioridades.map((p) => p.titulo);
  const after = atual.prioridades.map((p) => p.titulo);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    novas: after.filter((t) => !beforeSet.has(t)),
    removidas: before.filter((t) => !afterSet.has(t)),
    mantidas: after.filter((t) => beforeSet.has(t)),
  };
}

export type Reminder = {
  id: string;
  titulo: string;
  pilar: string | null;
  risco: string;
  due_date: string;
  offset_days: number;
  sent_at: string | null;
  read_at: string | null;
};

/** Lembretes de prazo (7 e 1 dia) do plano ativo. */
export function usePlanReminders() {
  return useQuery({
    queryKey: ["plan-reminders"],
    queryFn: async (): Promise<Reminder[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("plan_reminders")
        .select("id, titulo, pilar, risco, due_date, offset_days, sent_at, read_at")
        .eq("user_id", userId)
        .gte("due_date", today)
        .order("due_date", { ascending: true });
      return data ?? [];
    },
  });
}

export function useToggleActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      planId,
      key,
      done,
    }: {
      planId: string;
      key: string;
      done: boolean;
    }) => {
      const { error } = await supabase
        .from("action_items_done")
        .upsert({ plan_id: planId, item_key: key, done }, { onConflict: "plan_id,item_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plan"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Chama a rota protegida /api/ai-plano (a chave de IA vive apenas no servidor). */
export function useGeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resultId: string) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const response = await fetch("/api/ai-plano", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resultId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível gerar o plano agora.");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plan"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
