import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type LegalStatus = "vigente" | "alterada" | "revogada" | "suspensa" | "em_revisao";

export const STATUS_LABEL: Record<LegalStatus, string> = {
  vigente: "Vigente",
  alterada: "Alterada",
  revogada: "Revogada",
  suspensa: "Suspensa",
  em_revisao: "Em revisão",
};

export const NIVEL_AUTORIDADE_LABEL: Record<number, string> = {
  1: "1 · Norma oficial",
  2: "2 · Órgão regulador",
  3: "3 · Jurisprudência",
  4: "4 · Doutrina",
  5: "5 · Editorial não validado",
};

export type LegalFonte = {
  id: string;
  source_id: string;
  source_type: string;
  issuing_body: string;
  title: string;
  number: string | null;
  official_url: string | null;
  jurisdiction: string;
  authority_level: number;
  temas: string[];
  pilar: string | null;
  status: LegalStatus;
  publication_date: string | null;
  current_version_id: string | null;
  last_checked_at: string | null;
  responsavel_juridico: string | null;
  responsavel_medico: string | null;
  responsavel_produto: string | null;
  responsavel_tecnico: string | null;
};

export type LegalVersao = {
  id: string;
  source_uuid: string;
  version: number;
  status: LegalStatus;
  effective_from: string | null;
  effective_until: string | null;
  content: string;
  content_hash: string;
  change_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  published: boolean;
  created_at: string;
};

export type LegalAlerta = {
  source_uuid: string;
  source_id: string;
  title: string;
  status: LegalStatus;
  alerta: string;
};

const FONTE_SELECT =
  "id, source_id, source_type, issuing_body, title, number, official_url, jurisdiction, authority_level, temas, pilar, status, publication_date, current_version_id, last_checked_at, responsavel_juridico, responsavel_medico, responsavel_produto, responsavel_tecnico";

export function useLegalFontes() {
  return useQuery({
    queryKey: ["legal-fontes"],
    queryFn: async (): Promise<LegalFonte[]> => {
      const { data, error } = await supabase
        .from("legal_sources")
        .select(FONTE_SELECT)
        .order("authority_level")
        .order("title");
      if (error) throw error;
      return (data ?? []) as LegalFonte[];
    },
  });
}

export function useLegalVersoes(sourceUuid: string | null) {
  return useQuery({
    queryKey: ["legal-versoes", sourceUuid],
    enabled: Boolean(sourceUuid),
    queryFn: async (): Promise<LegalVersao[]> => {
      const { data, error } = await supabase
        .from("legal_source_versions")
        .select(
          "id, source_uuid, version, status, effective_from, effective_until, content, content_hash, change_reason, reviewed_by, reviewed_at, review_notes, published, created_at",
        )
        .eq("source_uuid", sourceUuid!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LegalVersao[];
    },
  });
}

export function useLegalAlertas() {
  return useQuery({
    queryKey: ["legal-alertas"],
    queryFn: async (): Promise<LegalAlerta[]> => {
      const { data, error } = await supabase
        .from("legal_source_alerts")
        .select("source_uuid, source_id, title, status, alerta")
        .limit(300);
      if (error) throw error;
      return (data ?? []) as LegalAlerta[];
    },
  });
}

/** Metadados de governança da fonte (responsáveis, situação, última conferência). */
export function useAtualizarFonte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: LegalStatus;
      official_url?: string | null;
      responsavel_juridico?: string | null;
      responsavel_medico?: string | null;
      responsavel_produto?: string | null;
      responsavel_tecnico?: string | null;
      marcarConferida?: boolean;
    }) => {
      const { id, marcarConferida, ...campos } = input;
      const payload: Record<string, unknown> = { ...campos };
      if (marcarConferida) payload.last_checked_at = new Date().toISOString();
      const { error } = await supabase.from("legal_sources").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legal-fontes"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-alertas"] });
    },
  });
}

/**
 * Cria uma nova versão sem apagar a anterior: a versão antiga recebe fim de
 * vigência e situação `alterada`, e deixa de ser recuperada como vigente.
 */
export function useNovaVersao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sourceUuid: string;
      content: string;
      effectiveFrom: string;
      changeReason: string;
      reviewedBy: string;
      reviewNotes?: string;
      novaSituacao?: LegalStatus;
      publicar?: boolean;
    }) => {
      const { data: anteriores, error: erroAnteriores } = await supabase
        .from("legal_source_versions")
        .select("id, version")
        .eq("source_uuid", input.sourceUuid)
        .order("version", { ascending: false })
        .limit(1);
      if (erroAnteriores) throw erroAnteriores;

      const anterior = anteriores?.[0] ?? null;
      const proxima = (anterior?.version ?? 0) + 1;

      const { data: criada, error } = await supabase
        .from("legal_source_versions")
        .insert({
          source_uuid: input.sourceUuid,
          version: proxima,
          status: input.novaSituacao ?? "vigente",
          effective_from: input.effectiveFrom,
          content: input.content,
          supersedes_version_id: anterior?.id ?? null,
          change_reason: input.changeReason,
          reviewed_by: input.reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_notes: input.reviewNotes ?? null,
          published: input.publicar ?? true,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (anterior) {
        const fim = new Date(input.effectiveFrom);
        fim.setDate(fim.getDate() - 1);
        await supabase
          .from("legal_source_versions")
          .update({ status: "alterada", effective_until: fim.toISOString().slice(0, 10) })
          .eq("id", anterior.id);
      }

      await supabase
        .from("legal_sources")
        .update({
          current_version_id: criada.id,
          status: input.novaSituacao ?? "vigente",
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", input.sourceUuid);

      return criada.id;
    },
    onSuccess: (_id, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["legal-versoes", vars.sourceUuid] });
      void queryClient.invalidateQueries({ queryKey: ["legal-fontes"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-alertas"] });
    },
  });
}

/** Bloqueio imediato: revoga ou suspende a fonte e retira a versão de circulação. */
export function useBloquearFonte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sourceUuid: string; situacao: "revogada" | "suspensa" }) => {
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("legal_source_versions")
        .update({ status: input.situacao, effective_until: hoje })
        .eq("source_uuid", input.sourceUuid)
        .eq("status", "vigente");
      if (error) throw error;
      const { error: erroFonte } = await supabase
        .from("legal_sources")
        .update({ status: input.situacao, last_checked_at: new Date().toISOString() })
        .eq("id", input.sourceUuid);
      if (erroFonte) throw erroFonte;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legal-fontes"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-versoes"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-alertas"] });
    },
  });
}

export type AuditoriaResposta = {
  id: string;
  origem: string;
  pergunta: string;
  fonte: string;
  nivel_risco: string | null;
  exige_advogado: boolean;
  citacoes: unknown;
  created_at: string;
};

export function useAuditoriaRespostas() {
  return useQuery({
    queryKey: ["auditoria-respostas"],
    queryFn: async (): Promise<AuditoriaResposta[]> => {
      const { data, error } = await supabase
        .from("ai_answer_audit")
        .select("id, origem, pergunta, fonte, nivel_risco, exige_advogado, citacoes, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AuditoriaResposta[];
    },
  });
}
