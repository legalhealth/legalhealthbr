import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const AUDIO_BUCKET = "patient-audio";
/** Retenção padrão do áudio bruto; depois disso resta apenas a transcrição. */
export const AUDIO_RETENCAO_DIAS = 90;

export type Paciente = {
  id: string;
  nome: string;
  nascimento: string | null;
  contato: string | null;
  convenio: string | null;
  observacoes: string | null;
  responsavel_legal: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type EventoTipo = "atendimento" | "procedimento" | "documento" | "minuta" | "triagem";

export type PacienteEvento = {
  id: string;
  patient_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  ocorrido_em: string;
  doc_id: string | null;
  document_id: string | null;
  triage_id: string | null;
  created_at: string;
};

export type TriagemUrgencia = "alta" | "media" | "baixa";

export type TriagemResumo = {
  motivo: string;
  resumo: string[];
  urgencia: TriagemUrgencia;
  encaminhamento: string;
  documentos: { slug: string; label: string }[];
  pendencias: string[];
};

export type Triagem = {
  id: string;
  patient_id: string;
  audio_path: string | null;
  transcricao: string;
  resumo: TriagemResumo | null;
  resumo_original: TriagemResumo | null;
  urgencia: string;
  encaminhamento: string | null;
  consentimento_atendimento_em: string | null;
  consentimento_audio_em: string | null;
  duracao_seg: number;
  status: string;
  revisado_por: string | null;
  revisado_em: string | null;
  created_at: string;
};

export const URGENCIA_META: Record<TriagemUrgencia, { label: string; className: string }> = {
  alta: { label: "Prioridade alta", className: "border-danger/40 bg-danger/10 text-danger" },
  media: { label: "Prioridade média", className: "border-warn/40 bg-warn/10 text-warn" },
  baixa: { label: "Prioridade baixa", className: "border-success/40 bg-success/10 text-success" },
};

export const EVENTO_META: Record<EventoTipo, string> = {
  atendimento: "Atendimento",
  procedimento: "Procedimento",
  documento: "Documento anexado",
  minuta: "Minuta gerada",
  triagem: "Triagem por voz",
};

export function urgenciaMeta(valor: string) {
  return URGENCIA_META[valor as TriagemUrgencia] ?? URGENCIA_META.media;
}

export function eventoLabel(tipo: string): string {
  return EVENTO_META[tipo as EventoTipo] ?? "Registro";
}

export function formatarData(valor: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataCurta(valor: string | null): string {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

async function exigirUsuario(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sessão expirada. Faça login novamente.");
  return id;
}

export type AuditoriaAcao = "visualizacao" | "exportacao" | "edicao" | "exclusao";

/** Registra quem fez o quê — sustenta a responsabilização exigida pela LGPD. */
export async function registrarAuditoria(input: {
  patientId: string | null;
  entidade: string;
  entidadeId?: string | null;
  acao: AuditoriaAcao;
  detalhe?: string;
}): Promise<void> {
  try {
    const userId = await exigirUsuario();
    await supabase.from("patient_audit_log").insert({
      user_id: userId,
      patient_id: input.patientId,
      entidade: input.entidade,
      entidade_id: input.entidadeId ?? null,
      acao: input.acao,
      detalhe: input.detalhe ?? null,
    });
  } catch {
    /* auditoria não deve interromper o uso da ficha */
  }
}

export function usePacientes(busca = "") {
  return useQuery({
    queryKey: ["pacientes", busca],
    queryFn: async (): Promise<(Paciente & { atendimentos: number })[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [];
      let query = supabase
        .from("patients")
        .select("*, patient_events(count)")
        .eq("user_id", userId)
        .order("nome", { ascending: true });
      if (busca.trim()) query = query.ilike("nome", `%${busca.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { patient_events: eventos, ...paciente } = row as unknown as Paciente & {
          patient_events: { count: number }[];
        };
        return { ...paciente, atendimentos: eventos?.[0]?.count ?? 0 };
      });
    },
  });
}

export function usePaciente(id: string) {
  return useQuery({
    queryKey: ["paciente", id],
    queryFn: async (): Promise<Paciente | null> => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Paciente | null) ?? null;
    },
    enabled: Boolean(id),
  });
}

export function useCriarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; contato?: string; nascimento?: string }) => {
      const userId = await exigirUsuario();
      const { data, error } = await supabase
        .from("patients")
        .insert({
          user_id: userId,
          nome: input.nome.trim(),
          contato: input.contato?.trim() || null,
          nascimento: input.nascimento || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });
}

const CAMPOS_FICHA = [
  "nome",
  "nascimento",
  "contato",
  "convenio",
  "observacoes",
  "responsavel_legal",
] as const;

type CampoFicha = (typeof CAMPOS_FICHA)[number];

/** Salva a ficha guardando o histórico de cada campo alterado. */
export function useAtualizarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      anterior,
      valores,
    }: {
      anterior: Paciente;
      valores: Partial<Record<CampoFicha, string | null>>;
    }) => {
      const userId = await exigirUsuario();
      const alteracoes = CAMPOS_FICHA.filter((campo) => {
        if (!(campo in valores)) return false;
        const novo = valores[campo] ?? null;
        const velho = (anterior[campo] as string | null) ?? null;
        return (novo || null) !== (velho || null);
      });
      if (!alteracoes.length) return;

      const patch: {
        nome?: string;
        nascimento?: string | null;
        contato?: string | null;
        convenio?: string | null;
        observacoes?: string | null;
        responsavel_legal?: string | null;
      } = {};
      for (const campo of alteracoes) {
        if (campo === "nome") patch.nome = (valores.nome || anterior.nome).trim();
        else patch[campo] = valores[campo] || null;
      }

      const { error } = await supabase.from("patients").update(patch).eq("id", anterior.id);
      if (error) throw error;

      await supabase.from("patient_field_history").insert(
        alteracoes.map((campo) => ({
          patient_id: anterior.id,
          user_id: userId,
          campo,
          valor_anterior: (anterior[campo] as string | null) ?? null,
          valor_novo: valores[campo] || null,
        })),
      );
      await registrarAuditoria({
        patientId: anterior.id,
        entidade: "paciente",
        entidadeId: anterior.id,
        acao: "edicao",
        detalhe: alteracoes.join(", "),
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["paciente", variables.anterior.id] });
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      void queryClient.invalidateQueries({ queryKey: ["paciente-historico-campos"] });
    },
  });
}

export function useHistoricoCampos(patientId: string) {
  return useQuery({
    queryKey: ["paciente-historico-campos", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_field_history")
        .select("id, campo, valor_anterior, valor_novo, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(patientId),
  });
}

export function useExcluirPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paciente: Paciente) => {
      const { data: triagens } = await supabase
        .from("patient_triages")
        .select("audio_path")
        .eq("patient_id", paciente.id);
      const audios = (triagens ?? [])
        .map((t) => t.audio_path)
        .filter((p): p is string => Boolean(p));
      if (audios.length) await supabase.storage.from(AUDIO_BUCKET).remove(audios);
      const { error } = await supabase.from("patients").delete().eq("id", paciente.id);
      if (error) throw error;
      await registrarAuditoria({
        patientId: null,
        entidade: "paciente",
        entidadeId: paciente.id,
        acao: "exclusao",
        detalhe: paciente.nome,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });
}

export function useEventos(patientId: string) {
  return useQuery({
    queryKey: ["paciente-eventos", patientId],
    queryFn: async (): Promise<PacienteEvento[]> => {
      const { data, error } = await supabase
        .from("patient_events")
        .select(
          "id, patient_id, tipo, titulo, descricao, ocorrido_em, doc_id, document_id, triage_id, created_at",
        )
        .eq("patient_id", patientId)
        .order("ocorrido_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PacienteEvento[];
    },
    enabled: Boolean(patientId),
  });
}

export function useCriarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patientId: string;
      tipo: EventoTipo;
      titulo: string;
      descricao?: string;
      ocorridoEm?: string;
      docId?: string | null;
      documentId?: string | null;
      triageId?: string | null;
    }) => {
      const userId = await exigirUsuario();
      const { error } = await supabase.from("patient_events").insert({
        patient_id: input.patientId,
        user_id: userId,
        tipo: input.tipo,
        titulo: input.titulo.trim(),
        descricao: input.descricao?.trim() || null,
        ocorrido_em: input.ocorridoEm || new Date().toISOString(),
        doc_id: input.docId ?? null,
        document_id: input.documentId ?? null,
        triage_id: input.triageId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["paciente-eventos", variables.patientId] });
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });
}

export function useExcluirEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evento: PacienteEvento) => {
      const { error } = await supabase.from("patient_events").delete().eq("id", evento.id);
      if (error) throw error;
      await registrarAuditoria({
        patientId: evento.patient_id,
        entidade: "evento",
        entidadeId: evento.id,
        acao: "exclusao",
        detalhe: evento.titulo,
      });
    },
    onSuccess: (_d, evento) => {
      void queryClient.invalidateQueries({ queryKey: ["paciente-eventos", evento.patient_id] });
      void queryClient.invalidateQueries({ queryKey: ["paciente-triagens", evento.patient_id] });
    },
  });
}

export function useTriagens(patientId: string) {
  return useQuery({
    queryKey: ["paciente-triagens", patientId],
    queryFn: async (): Promise<Triagem[]> => {
      const { data, error } = await supabase
        .from("patient_triages")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Triagem[];
    },
    enabled: Boolean(patientId),
  });
}

/** Documentos anexados e minutas já vinculados ao paciente. */
export function useDocumentosDoPaciente(patientId: string) {
  return useQuery({
    queryKey: ["paciente-documentos", patientId],
    queryFn: async () => {
      const [anexos, minutas] = await Promise.all([
        supabase
          .from("documents")
          .select("id, nome, tag, storage_path, created_at")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("generated_docs")
          .select("id, titulo, tipo, status, created_at")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ]);
      return { anexos: anexos.data ?? [], minutas: minutas.data ?? [] };
    },
    enabled: Boolean(patientId),
  });
}

export async function audioAssinado(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Cria a triagem já com os consentimentos registrados e devolve o id. */
export async function criarTriagem(input: {
  patientId: string;
  consentimentoAtendimento: boolean;
  consentimentoAudio: boolean;
}): Promise<string> {
  const userId = await exigirUsuario();
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from("patient_triages")
    .insert({
      patient_id: input.patientId,
      user_id: userId,
      status: "gravando",
      consentimento_atendimento_em: input.consentimentoAtendimento ? agora : null,
      consentimento_audio_em: input.consentimentoAudio ? agora : null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Guarda transcrição, resumo da IA e (se consentido) o áudio da triagem. */
export async function salvarTriagem(input: {
  triageId: string;
  patientId: string;
  transcricao: string;
  resumo: TriagemResumo;
  duracaoSeg: number;
  audio: Blob | null;
}): Promise<void> {
  const userId = await exigirUsuario();
  let audioPath: string | null = null;
  if (input.audio) {
    audioPath = `${userId}/${input.patientId}/${input.triageId}.wav`;
    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(audioPath, input.audio, { contentType: "audio/wav", upsert: true });
    if (uploadError) audioPath = null;
  }

  const { error } = await supabase
    .from("patient_triages")
    .update({
      transcricao: input.transcricao,
      resumo: input.resumo as unknown as never,
      resumo_original: input.resumo as unknown as never,
      urgencia: input.resumo.urgencia,
      encaminhamento: input.resumo.encaminhamento,
      duracao_seg: input.duracaoSeg,
      audio_path: audioPath,
      status: "revisao",
    })
    .eq("id", input.triageId);
  if (error) throw error;
}

/** Confirma a triagem após a revisão do profissional (podendo ter editado). */
export function useConfirmarTriagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { triagem: Triagem; resumo: TriagemResumo }) => {
      const userId = await exigirUsuario();
      const { error } = await supabase
        .from("patient_triages")
        .update({
          resumo: input.resumo as unknown as never,
          urgencia: input.resumo.urgencia,
          encaminhamento: input.resumo.encaminhamento,
          status: "confirmada",
          revisado_por: userId,
          revisado_em: new Date().toISOString(),
        })
        .eq("id", input.triagem.id);
      if (error) throw error;

      await supabase.from("patient_events").insert({
        patient_id: input.triagem.patient_id,
        user_id: userId,
        tipo: "triagem",
        titulo: input.resumo.motivo || "Triagem por voz",
        descricao: input.resumo.encaminhamento,
        triage_id: input.triagem.id,
      });
      await registrarAuditoria({
        patientId: input.triagem.patient_id,
        entidade: "triagem",
        entidadeId: input.triagem.id,
        acao: "edicao",
        detalhe: "triagem revisada e confirmada",
      });
    },
    onSuccess: (_d, variables) => {
      const id = variables.triagem.patient_id;
      void queryClient.invalidateQueries({ queryKey: ["paciente-triagens", id] });
      void queryClient.invalidateQueries({ queryKey: ["paciente-eventos", id] });
    },
  });
}

export function useExcluirTriagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (triagem: Triagem) => {
      if (triagem.audio_path) {
        await supabase.storage.from(AUDIO_BUCKET).remove([triagem.audio_path]);
      }
      const { error } = await supabase.from("patient_triages").delete().eq("id", triagem.id);
      if (error) throw error;
      await registrarAuditoria({
        patientId: triagem.patient_id,
        entidade: "triagem",
        entidadeId: triagem.id,
        acao: "exclusao",
      });
    },
    onSuccess: (_d, triagem) => {
      void queryClient.invalidateQueries({ queryKey: ["paciente-triagens", triagem.patient_id] });
      void queryClient.invalidateQueries({ queryKey: ["paciente-eventos", triagem.patient_id] });
    },
  });
}

/** Apaga o áudio bruto que passou do prazo de retenção, mantendo a transcrição. */
export async function limparAudiosExpirados(patientId: string): Promise<void> {
  const limite = new Date(Date.now() - AUDIO_RETENCAO_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("patient_triages")
    .select("id, audio_path")
    .eq("patient_id", patientId)
    .not("audio_path", "is", null)
    .lt("created_at", limite);
  for (const triagem of data ?? []) {
    if (!triagem.audio_path) continue;
    await supabase.storage.from(AUDIO_BUCKET).remove([triagem.audio_path]);
    await supabase.from("patient_triages").update({ audio_path: null }).eq("id", triagem.id);
  }
}

/**
 * Triagens de prioridade alta sem nenhum atendimento ou procedimento
 * registrado depois — a lacuna que mais gera risco de processo.
 */
export function useTriagensSemDesfecho() {
  return useQuery({
    queryKey: ["triagens-sem-desfecho"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return [] as { triagem: Triagem; paciente: string }[];

      const { data: triagens } = await supabase
        .from("patient_triages")
        .select("*, patients(nome)")
        .eq("user_id", userId)
        .eq("urgencia", "alta")
        .order("created_at", { ascending: false })
        .limit(30);

      const lista = (triagens ?? []) as unknown as (Triagem & {
        patients: { nome: string } | null;
      })[];
      if (!lista.length) return [];

      const { data: eventos } = await supabase
        .from("patient_events")
        .select("patient_id, tipo, ocorrido_em")
        .eq("user_id", userId)
        .in("tipo", ["atendimento", "procedimento"]);

      return lista
        .filter((triagem) => {
          const desfecho = (eventos ?? []).some(
            (evento) =>
              evento.patient_id === triagem.patient_id &&
              new Date(evento.ocorrido_em).getTime() >= new Date(triagem.created_at).getTime(),
          );
          return !desfecho;
        })
        .map((triagem) => ({ triagem, paciente: triagem.patients?.nome ?? "Paciente" }));
    },
  });
}
