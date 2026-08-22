import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { DOC_BUCKET } from "@/lib/ia-documents";

export type RevisaoStatus = "enviada" | "em_revisao" | "ajustes" | "aprovada";

export const REVISAO_STATUS_META: Record<
  RevisaoStatus,
  { label: string; className: string; dot: string }
> = {
  enviada: {
    label: "Enviada ao advogado",
    className: "border-info/40 bg-info/10 text-info",
    dot: "bg-info",
  },
  em_revisao: {
    label: "Em revisão",
    className: "border-warn/40 bg-warn/10 text-warn",
    dot: "bg-warn",
  },
  ajustes: {
    label: "Ajustes solicitados",
    className: "border-danger/40 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
  aprovada: {
    label: "Aprovada pelo advogado",
    className: "border-success/40 bg-success/10 text-success",
    dot: "bg-success",
  },
};

export function revisaoStatusMeta(status: string) {
  return REVISAO_STATUS_META[status as RevisaoStatus] ?? REVISAO_STATUS_META.enviada;
}

export type Revisao = {
  id: string;
  doc_id: string;
  advogado_nome: string;
  advogado_email: string;
  advogado_oab: string | null;
  mensagem: string | null;
  status: string;
  document_ids: string[];
  enviado_em: string;
  concluido_em: string | null;
  updated_at: string;
};

export type RevisaoComentario = {
  id: string;
  revisao_id: string;
  autor: string;
  papel: string;
  conteudo: string;
  created_at: string;
};

const SELECT_REVISAO =
  "id, doc_id, advogado_nome, advogado_email, advogado_oab, mensagem, status, document_ids, enviado_em, concluido_em, updated_at";

export function useRevisoes() {
  return useQuery({
    queryKey: ["revisoes"],
    queryFn: async (): Promise<Revisao[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("revisoes")
        .select(SELECT_REVISAO)
        .eq("user_id", userId)
        .order("enviado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Revisao[];
    },
  });
}

export function useRevisaoComentarios(revisaoId: string | null) {
  return useQuery({
    queryKey: ["revisao-comentarios", revisaoId],
    enabled: Boolean(revisaoId),
    queryFn: async (): Promise<RevisaoComentario[]> => {
      if (!revisaoId) return [];
      const { data, error } = await supabase
        .from("revisao_comentarios")
        .select("id, revisao_id, autor, papel, conteudo, created_at")
        .eq("revisao_id", revisaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type EnviarRevisaoInput = {
  docId: string;
  docTitulo: string;
  advogadoNome: string;
  advogadoEmail: string;
  advogadoOab?: string;
  mensagem?: string;
  documentIds: string[];
};

/** Cria a revisão, marca a peça como "em revisão" e devolve links assinados dos anexos. */
export function useEnviarRevisao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnviarRevisaoInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

      const { data, error } = await supabase
        .from("revisoes")
        .insert({
          user_id: userId,
          doc_id: input.docId,
          advogado_nome: input.advogadoNome,
          advogado_email: input.advogadoEmail,
          advogado_oab: input.advogadoOab?.trim() ? input.advogadoOab.trim() : null,
          mensagem: input.mensagem?.trim() ? input.mensagem.trim() : null,
          status: "enviada",
          document_ids: input.documentIds,
        })
        .select(SELECT_REVISAO)
        .single();
      if (error) throw error;

      await supabase.from("generated_docs").update({ status: "revisao" }).eq("id", input.docId);

      await supabase.from("revisao_comentarios").insert({
        revisao_id: data.id,
        autor: "Você",
        papel: "medico",
        conteudo: input.mensagem?.trim()
          ? `Envio para revisão: ${input.mensagem.trim()}`
          : `Peça "${input.docTitulo}" enviada para revisão de ${input.advogadoNome}.`,
      });

      return data as Revisao;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["revisoes"] });
      void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
    },
  });
}

export function useAtualizarRevisaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      revisao,
      status,
    }: {
      revisao: Revisao;
      status: RevisaoStatus;
    }) => {
      const { error } = await supabase
        .from("revisoes")
        .update({
          status,
          concluido_em: status === "aprovada" ? new Date().toISOString() : null,
        })
        .eq("id", revisao.id);
      if (error) throw error;

      const docStatus =
        status === "aprovada" ? "concluido" : status === "ajustes" ? "rascunho" : "revisao";
      await supabase.from("generated_docs").update({ status: docStatus }).eq("id", revisao.doc_id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["revisoes"] });
      void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
    },
  });
}

export function useAdicionarComentario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      revisaoId: string;
      autor: string;
      papel: "medico" | "advogado";
      conteudo: string;
    }) => {
      const { error } = await supabase.from("revisao_comentarios").insert({
        revisao_id: input.revisaoId,
        autor: input.autor,
        papel: input.papel,
        conteudo: input.conteudo,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["revisao-comentarios", variables.revisaoId],
      });
      void queryClient.invalidateQueries({ queryKey: ["revisoes"] });
    },
  });
}


/** Monta o comprovante de envio (texto) para download pelo médico. */
export function buildComprovante(input: {
  revisao: Revisao;
  titulo: string;
  conteudo: string;
  anexos: { nome: string; tamanho: string }[];
}): { filename: string; content: string } {
  const enviadoEm = new Date(input.revisao.enviado_em).toLocaleString("pt-BR");
  const resumo = input.conteudo.trim();

  const content = [
    "LEGAL HEALTH — COMPROVANTE DE ENVIO PARA REVISÃO JURÍDICA",
    "ANTECIPE · DECIDA · PROTEJA",
    "",
    `Protocolo: ${input.revisao.id}`,
    `Enviado em: ${enviadoEm}`,
    `Peça: ${input.titulo}`,
    "",
    "ADVOGADO RESPONSÁVEL",
    `Nome: ${input.revisao.advogado_nome}`,
    `E-mail: ${input.revisao.advogado_email}`,
    `OAB: ${input.revisao.advogado_oab ?? "não informado"}`,
    "",
    "MENSAGEM ENVIADA",
    input.revisao.mensagem ?? "Sem mensagem adicional.",
    "",
    `ANEXOS (${input.anexos.length})`,
    input.anexos.length > 0
      ? input.anexos.map((a, i) => `${i + 1}. ${a.nome} — ${a.tamanho}`).join("\n")
      : "Nenhum anexo enviado.",
    "",
    "RESUMO DO CONTEÚDO ENVIADO",
    resumo.length > 4000 ? `${resumo.slice(0, 4000)}\n[...conteúdo truncado neste comprovante]` : resumo,
    "",
    "Documento gerado por IA na plataforma Legal Health — sujeito a revisão do advogado responsável.",
  ].join("\n");

  const stamp = new Date(input.revisao.enviado_em).toISOString().slice(0, 10);
  return {
    filename: `comprovante-revisao-${stamp}-${input.revisao.id.slice(0, 8)}.txt`,
    content,
  };
}
