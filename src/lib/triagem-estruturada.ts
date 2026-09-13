import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { contaAtivaId } from "@/lib/clinica";
import { registrarAuditoria } from "@/lib/pacientes";

export type NivelRisco = "baixo" | "moderado" | "alto";

export type TriagemEstruturada = {
  id: string;
  patient_id: string;
  user_id: string;
  queixa: string;
  sintomas: string | null;
  historico: string | null;
  medicacoes: string | null;
  exames: string | null;
  sinais_alerta: string[];
  fatores_risco: string[];
  risco: string;
  risco_justificativa: string | null;
  encaminhamento: string | null;
  documentos: { slug: string; label: string }[] | null;
  doc_id: string | null;
  status: string;
  confirmado_em: string | null;
  created_at: string;
};

/** Sinais que puxam a prioridade para cima — critérios administrativos, não diagnóstico. */
export const SINAIS_ALERTA = [
  "Dor torácica ou falta de ar",
  "Sangramento ativo",
  "Febre alta persistente",
  "Perda de consciência ou confusão",
  "Sinais de infecção na ferida operatória",
  "Dor intensa sem alívio com a medicação",
  "Déficit neurológico novo",
  "Queixa após procedimento recente",
] as const;

export const FATORES_RISCO = [
  "Idoso (acima de 65 anos)",
  "Gestante",
  "Criança (menor de 12 anos)",
  "Diabetes",
  "Hipertensão",
  "Imunossupressão",
  "Uso de anticoagulante",
  "Cirurgia nos últimos 30 dias",
  "Histórico de reclamação ou processo",
] as const;

export const RISCO_META: Record<NivelRisco, { label: string; className: string; prazo: string }> = {
  alto: {
    label: "Risco alto",
    className: "border-danger/40 bg-danger/10 text-danger",
    prazo: "Avaliação médica imediata",
  },
  moderado: {
    label: "Risco moderado",
    className: "border-warn/40 bg-warn/10 text-warn",
    prazo: "Avaliação médica em até 24 horas",
  },
  baixo: {
    label: "Risco baixo",
    className: "border-success/40 bg-success/10 text-success",
    prazo: "Agendamento de rotina",
  },
};

export function riscoMeta(valor: string) {
  return RISCO_META[valor as NivelRisco] ?? RISCO_META.baixo;
}

/** Classificação administrativa por contagem de sinais/fatores — sempre revisada pelo profissional. */
export function calcularRisco(
  sinais: string[],
  fatores: string[],
): { risco: NivelRisco; justificativa: string } {
  if (sinais.length >= 1 && (sinais.length >= 2 || fatores.length >= 2)) {
    return {
      risco: "alto",
      justificativa: `Sinais de alerta marcados (${sinais.length}) com ${fatores.length} fator(es) de risco.`,
    };
  }
  if (sinais.length >= 1) {
    return { risco: "alto", justificativa: `Sinal de alerta marcado: ${sinais[0]}.` };
  }
  if (fatores.length >= 2) {
    return {
      risco: "moderado",
      justificativa: `${fatores.length} fatores de risco registrados, sem sinais de alerta.`,
    };
  }
  if (fatores.length === 1) {
    return { risco: "moderado", justificativa: `Fator de risco registrado: ${fatores[0]}.` };
  }
  return { risco: "baixo", justificativa: "Sem sinais de alerta ou fatores de risco marcados." };
}

export function useTriagensEstruturadas(patientId: string) {
  return useQuery({
    queryKey: ["paciente-triagens-form", patientId],
    queryFn: async (): Promise<TriagemEstruturada[]> => {
      const { data, error } = await supabase
        .from("patient_screenings")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TriagemEstruturada[];
    },
    enabled: Boolean(patientId),
  });
}

export type TriagemFormInput = {
  patientId: string;
  queixa: string;
  sintomas: string;
  historico: string;
  medicacoes: string;
  exames: string;
  sinais: string[];
  fatores: string[];
  encaminhamento: string;
};

export function useSalvarTriagemEstruturada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TriagemFormInput & { docId?: string | null }) => {
      const [userId, auth] = await Promise.all([contaAtivaId(), supabase.auth.getUser()]);
      const { risco, justificativa } = calcularRisco(input.sinais, input.fatores);
      const { data, error } = await supabase
        .from("patient_screenings")
        .insert({
          patient_id: input.patientId,
          user_id: userId,
          autor_user_id: auth.data.user?.id ?? null,
          queixa: input.queixa.trim(),
          sintomas: input.sintomas.trim() || null,
          historico: input.historico.trim() || null,
          medicacoes: input.medicacoes.trim() || null,
          exames: input.exames.trim() || null,
          sinais_alerta: input.sinais,
          fatores_risco: input.fatores,
          risco,
          risco_justificativa: justificativa,
          encaminhamento: input.encaminhamento.trim() || riscoMeta(risco).prazo,
          doc_id: input.docId ?? null,
          status: "confirmada",
          confirmado_em: new Date().toISOString(),
        })
        .select("id, risco")
        .single();
      if (error) throw error;

      await supabase.from("patient_events").insert({
        patient_id: input.patientId,
        user_id: userId,
        tipo: "triagem",
        titulo: input.queixa.trim() || "Triagem clínica",
        descricao: `${riscoMeta(risco).label} · ${justificativa}`,
        doc_id: input.docId ?? null,
      });
      await registrarAuditoria({
        patientId: input.patientId,
        entidade: "triagem-estruturada",
        entidadeId: data.id as string,
        acao: "edicao",
        detalhe: `triagem registrada (${risco})`,
      });
      return { id: data.id as string, risco: risco as NivelRisco, justificativa };
    },
    onSuccess: (_d, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["paciente-triagens-form", variables.patientId],
      });
      void queryClient.invalidateQueries({ queryKey: ["paciente-eventos", variables.patientId] });
    },
  });
}

/** Texto enviado à IA para virar a minuta de registro do atendimento. */
export function resumoParaMinuta(input: TriagemFormInput, risco: NivelRisco, just: string): string {
  const linhas = [
    `Queixa principal: ${input.queixa.trim() || "não informada"}`,
    input.sintomas.trim() ? `Sintomas relatados: ${input.sintomas.trim()}` : null,
    input.historico.trim() ? `Histórico relevante: ${input.historico.trim()}` : null,
    input.medicacoes.trim() ? `Medicações em uso: ${input.medicacoes.trim()}` : null,
    input.exames.trim() ? `Exames apresentados: ${input.exames.trim()}` : null,
    input.sinais.length ? `Sinais de alerta: ${input.sinais.join("; ")}` : "Sinais de alerta: nenhum",
    input.fatores.length ? `Fatores de risco: ${input.fatores.join("; ")}` : "Fatores de risco: nenhum",
    `Classificação administrativa de prioridade: ${riscoMeta(risco).label} — ${just}`,
    `Encaminhamento sugerido: ${input.encaminhamento.trim() || riscoMeta(risco).prazo}`,
  ];
  return linhas.filter(Boolean).join("\n");
}
