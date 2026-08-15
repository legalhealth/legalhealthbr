import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type RecommendationStatus = "pendente" | "andamento" | "concluida" | "descartada";

export type Recommendation = {
  id: string;
  content: string;
  origem: string;
  status: string;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
};

export const REC_STATUS_META: Record<
  RecommendationStatus,
  { label: string; className: string }
> = {
  pendente: { label: "Pendente", className: "border-info/40 bg-info/10 text-info" },
  andamento: { label: "Em andamento", className: "border-warn/40 bg-warn/10 text-warn" },
  concluida: { label: "Concluída", className: "border-success/40 bg-success/10 text-success" },
  descartada: { label: "Descartada", className: "border-border bg-muted text-subtle" },
};

export function recStatusMeta(status: string) {
  return REC_STATUS_META[status as RecommendationStatus] ?? REC_STATUS_META.pendente;
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: async (): Promise<Recommendation[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ai_recommendations")
        .select("id, content, origem, status, thread_id, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; threadId?: string | null; origem?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sem sessão");
      const { error } = await supabase.from("ai_recommendations").insert({
        user_id: userId,
        content: input.content,
        origem: input.origem ?? "assistente",
        ...(input.threadId ? { thread_id: input.threadId } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
  });
}

export function useUpdateRecommendationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RecommendationStatus }) => {
      const { error } = await supabase
        .from("ai_recommendations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
  });
}

export function useDeleteRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_recommendations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
  });
}