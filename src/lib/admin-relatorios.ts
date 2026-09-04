import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import {
  relatorioChatbot,
  relatorioJuriscore,
  type PeriodoDias,
} from "@/lib/admin-relatorios.functions";

export type { PeriodoDias };

export const PERIODOS: PeriodoDias[] = [7, 30, 90];

export const STATUS_CANDIDATURA = [
  { valor: "recebida", label: "Recebida" },
  { valor: "em_analise", label: "Em análise" },
  { valor: "aprovada", label: "Aprovada" },
  { valor: "recusada", label: "Recusada" },
] as const;

export type Candidatura = {
  id: string;
  nome: string;
  email: string;
  profissao: string;
  estado: string;
  cidade: string | null;
  tipo_atuacao: string | null;
  link_profissional: string | null;
  comunidade_tamanho: string | null;
  consentimento_contato: boolean;
  status: string;
  created_at: string;
};

function desde(dias: PeriodoDias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export function useCandidaturas(dias: PeriodoDias) {
  return useQuery({
    queryKey: ["admin-candidaturas", dias],
    staleTime: 60_000,
    queryFn: async (): Promise<Candidatura[]> => {
      const { data, error } = await supabase
        .from("ambassador_applications")
        .select(
          "id, nome, email, profissao, estado, cidade, tipo_atuacao, link_profissional, comunidade_tamanho, consentimento_contato, status, created_at",
        )
        .gte("created_at", desde(dias))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Candidatura[];
    },
  });
}

export function useAtualizarStatusCandidatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ambassador_applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-candidaturas"] }),
  });
}

export function useRelatorioChatbot(dias: PeriodoDias) {
  const fn = useServerFn(relatorioChatbot);
  return useQuery({
    queryKey: ["admin-chatbot", dias],
    staleTime: 60_000,
    queryFn: () => fn({ data: { dias } }),
  });
}

export function useRelatorioJuriscore(dias: PeriodoDias) {
  const fn = useServerFn(relatorioJuriscore);
  return useQuery({
    queryKey: ["admin-juriscore", dias],
    staleTime: 60_000,
    queryFn: () => fn({ data: { dias } }),
  });
}

/** CSV gerado no navegador; contém dados pessoais das candidaturas. */
export function baixarCsvCandidaturas(linhas: Candidatura[]) {
  const cabecalho = [
    "nome",
    "email",
    "profissao",
    "estado",
    "cidade",
    "tipo_atuacao",
    "link_profissional",
    "comunidade_tamanho",
    "consentimento_contato",
    "status",
    "created_at",
  ];
  const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    cabecalho.join(","),
    ...linhas.map((l) =>
      [
        l.nome,
        l.email,
        l.profissao,
        l.estado,
        l.cidade,
        l.tipo_atuacao,
        l.link_profissional,
        l.comunidade_tamanho,
        l.consentimento_contato ? "sim" : "nao",
        l.status,
        l.created_at,
      ]
        .map(escapar)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidaturas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
