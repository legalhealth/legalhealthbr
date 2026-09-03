import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type LegalQaCategoria = "juridico" | "suporte" | "comercial";

export type LegalQa = {
  id: string;
  pergunta: string;
  variacoes: string[];
  resposta: string;
  fundamentacao: string[];
  pilar: string | null;
  categoria: string;
  tags: string[];
  status: string;
  usos: number;
  created_at: string;
  updated_at: string;
};

export type LegalQaLacuna = {
  id: string;
  pergunta: string;
  origem: string;
  ocorrencias: number;
  created_at: string;
  updated_at: string;
};

export const CATEGORIA_LABEL: Record<string, string> = {
  juridico: "Jurídico",
  suporte: "Suporte",
  comercial: "Comercial",
};

const SELECT =
  "id, pergunta, variacoes, resposta, fundamentacao, pilar, categoria, tags, status, usos, created_at, updated_at";

export function useLegalQa(busca = "") {
  return useQuery({
    queryKey: ["legal-qa", busca],
    queryFn: async (): Promise<LegalQa[]> => {
      let query = supabase.from("legal_qa").select(SELECT).order("updated_at", { ascending: false });
      if (busca.trim().length >= 2) query = query.ilike("pergunta", `%${busca.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as LegalQa[];
    },
  });
}

export function useLegalQaLacunas() {
  return useQuery({
    queryKey: ["legal-qa-lacunas"],
    queryFn: async (): Promise<LegalQaLacuna[]> => {
      const { data, error } = await supabase
        .from("legal_qa_lacunas")
        .select("id, pergunta, origem, ocorrencias, created_at, updated_at")
        .order("ocorrencias", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as LegalQaLacuna[];
    },
  });
}

export type LegalQaInput = {
  id?: string;
  pergunta: string;
  variacoes: string[];
  resposta: string;
  fundamentacao: string[];
  pilar?: string | null;
  categoria: string;
  tags: string[];
  status: string;
};

export function useSalvarLegalQa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LegalQaInput) => {
      const payload = {
        pergunta: input.pergunta.trim(),
        variacoes: input.variacoes,
        resposta: input.resposta.trim(),
        fundamentacao: input.fundamentacao,
        pilar: input.pilar?.trim() ? input.pilar.trim() : null,
        categoria: input.categoria,
        tags: input.tags,
        status: input.status,
      };
      if (input.id) {
        const { error } = await supabase.from("legal_qa").update(payload).eq("id", input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase.from("legal_qa").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legal-qa"] });
    },
  });
}

export function useExcluirLegalQa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_qa").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legal-qa"] });
    },
  });
}

export function useExcluirLacuna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_qa_lacunas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legal-qa-lacunas"] });
    },
  });
}

/** Divide texto separado por linhas em lista limpa (variações, fundamentação, tags). */
export function linhasParaLista(valor: string): string[] {
  return valor
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
