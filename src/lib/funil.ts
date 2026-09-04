import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type FunilPeriodo = 7 | 30 | 90;
export type FunilRota = "todas" | "/" | "/embaixadores";

export type EtapaLinha = { etapa: string; sessoes: number; eventos: number };

export const ETAPAS_FUNIL = [
  { key: "landing_view", label: "Visitaram a página" },
  { key: "application_form_view", label: "Chegaram ao formulário" },
  { key: "application_start", label: "Começaram a preencher" },
  { key: "application_submit", label: "Enviaram a candidatura" },
] as const;

export const MOTIVOS_LABEL: Record<string, string> = {
  consentimento: "Não aceitou regulamento/ciência",
  motivo: "Texto do motivo muito curto",
  obrigatorios: "Profissão ou estado em falta",
  antispam: "Bloqueio de verificação de envio",
};

function desde(dias: FunilPeriodo) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

/** Resumo por etapa (sessões distintas e total de eventos). */
export function useFunil(periodo: FunilPeriodo, rota: FunilRota) {
  return useQuery({
    queryKey: ["funil-landing", periodo, rota],
    staleTime: 60_000,
    queryFn: async (): Promise<EtapaLinha[]> => {
      const { data, error } = await supabase.rpc("funil_landing", {
        _desde: desde(periodo),
        _rota: rota === "todas" ? null : rota,
      });
      if (error) throw error;
      return (data ?? []) as EtapaLinha[];
    },
  });
}

/** Motivos que bloquearam o envio, agregados pelo rótulo do campo. */
export function useMotivosAbandono(periodo: FunilPeriodo, rota: FunilRota) {
  return useQuery({
    queryKey: ["funil-motivos", periodo, rota],
    staleTime: 60_000,
    queryFn: async (): Promise<{ motivo: string; total: number }[]> => {
      let q = supabase
        .from("landing_events")
        .select("id_ref")
        .eq("event", "application_field_error")
        .gte("created_at", desde(periodo));
      if (rota !== "todas") q = q.eq("rota", rota);
      const { data, error } = await q;
      if (error) throw error;
      const mapa = new Map<string, number>();
      for (const linha of data ?? []) {
        const chave = linha.id_ref ?? "outros";
        mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
      }
      return [...mapa.entries()]
        .map(([motivo, total]) => ({ motivo, total }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

/** Candidaturas realmente salvas no período, para conferência. */
export function useCandidaturasSalvas(periodo: FunilPeriodo) {
  return useQuery({
    queryKey: ["funil-candidaturas", periodo],
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("ambassador_applications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", desde(periodo));
      if (error) throw error;
      return count ?? 0;
    },
  });
}
