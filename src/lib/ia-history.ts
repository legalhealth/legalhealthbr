import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type HistoryOrigem = "risco" | "peca" | "biblioteca";

export type HistoryStatus = "rascunho" | "revisao" | "concluido" | "arquivado";

export type HistoryItem = {
  id: string;
  origem: string | null;
  tipo: string | null;
  titulo: string | null;
  conteudo: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const STATUS_META: Record<
  HistoryStatus,
  { label: string; className: string }
> = {
  rascunho: {
    label: "Rascunho",
    className: "border-info/40 bg-info/10 text-info",
  },
  revisao: {
    label: "Em revisão",
    className: "border-warn/40 bg-warn/10 text-warn",
  },
  concluido: {
    label: "Concluído",
    className: "border-success/40 bg-success/10 text-success",
  },
  arquivado: {
    label: "Arquivado",
    className: "border-border bg-muted text-subtle",
  },
};

export const ORIGEM_META: Record<HistoryOrigem, string> = {
  risco: "Análise de risco",
  peca: "Peça gerada",
  biblioteca: "Biblioteca",
};

export function statusMeta(status: string) {
  return STATUS_META[status as HistoryStatus] ?? STATUS_META.rascunho;
}

export function origemLabel(origem: string | null): string {
  return ORIGEM_META[origem as HistoryOrigem] ?? "Documento";
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function saveHistoryItem(input: {
  origem: HistoryOrigem;
  tipo: string;
  titulo: string;
  conteudo: string;
  contexto?: Json;
  /** vincula a minuta à ficha do paciente */
  patientId?: string;
}): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("generated_docs")
    .insert({
    user_id: userId,
    origem: input.origem,
    tipo: input.tipo,
    titulo: input.titulo,
    conteudo: input.conteudo,
    status: "rascunho",
    ...(input.contexto ? { contexto: input.contexto } : {}),
    ...(input.patientId ? { patient_id: input.patientId } : {}),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

export function useIaHistory() {
  return useQuery({
    queryKey: ["ia-history"],
    queryFn: async (): Promise<HistoryItem[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("generated_docs")
        .select("id, origem, tipo, titulo, conteudo, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateHistoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: HistoryStatus }) => {
      const { error } = await supabase
        .from("generated_docs")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
    },
  });
}

export function useDeleteHistoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generated_docs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
    },
  });
}