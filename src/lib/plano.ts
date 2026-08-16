import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Risco = "alto" | "medio" | "baixo";

export type Prioridade = {
  titulo: string;
  pilar: string;
  risco: Risco;
  prazo: string;
  acoes: string[];
};

export type ActionPlan = {
  id: string;
  resumo: string | null;
  prioridades: Prioridade[];
  created_at: string;
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
    .map((item) => ({
      titulo: String(item['titulo'] ?? "Ação preventiva"),
      pilar: String(item['pilar'] ?? "Documental"),
      risco: (["alto", "medio", "baixo"].includes(String(item['risco']))
        ? String(item['risco'])
        : "medio") as Risco,
      prazo: String(item['prazo'] ?? "30 dias"),
      acoes: Array.isArray(item['acoes']) ? item['acoes'].map((a) => String(a)) : [],
    }));
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
        .select("id, resumo, prioridades, created_at")
        .eq("user_id", userId)
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
            }
          : null,
        doneKeys,
      };
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
