import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AUDIO_BUCKET = "patient-audio";

export type AuditoriaAcao =
  "visualizacao" | "exportacao" | "edicao" | "exclusao" | "exportacao_titular" | "exclusao_titular";

type AuditoriaInput = {
  patientId: string | null;
  entidade: string;
  entidadeId?: string | null;
  acao: AuditoriaAcao;
  detalhe?: string | null;
  /** Dono da conta quando o registro não tem paciente (ex.: exclusão já concluída). */
  contaId?: string | null;
};

const ACOES: AuditoriaAcao[] = [
  "visualizacao",
  "exportacao",
  "edicao",
  "exclusao",
  "exportacao_titular",
  "exclusao_titular",
];

type AuditoriaLimpa = {
  patientId: string | null;
  entidade: string;
  entidadeId: string | null;
  acao: AuditoriaAcao;
  detalhe: string | null;
  contaId: string | null;
};

function validarAuditoria(input: AuditoriaInput): AuditoriaLimpa {
  const acao = String(input?.acao ?? "") as AuditoriaAcao;
  if (!ACOES.includes(acao)) throw new Error("Ação de auditoria inválida.");
  const entidade = String(input?.entidade ?? "").trim();
  if (!entidade) throw new Error("Entidade obrigatória.");
  return {
    patientId: input.patientId ? String(input.patientId) : null,
    entidade: entidade.slice(0, 40),
    entidadeId: input.entidadeId ? String(input.entidadeId) : null,
    acao,
    detalhe: input.detalhe ? String(input.detalhe).slice(0, 500) : null,
    contaId: input.contaId ? String(input.contaId) : null,
  };
}

type ClienteConta = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        value: string,
      ) => { maybeSingle: () => Promise<{ data: { user_id: string } | null }> };
    };
  };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }>;
};

/**
 * Resolve o dono da conta a partir do próprio banco (nunca do cliente) e
 * confirma que o usuário autenticado pode acessá-la.
 */
async function contaDoRegistro(
  supabase: unknown,
  userId: string,
  patientId: string | null,
  contaInformada: string | null,
): Promise<string> {
  const client = supabase as ClienteConta;

  if (patientId) {
    const { data } = await client
      .from("patients")
      .select("user_id")
      .eq("id", patientId)
      .maybeSingle();
    if (!data) throw new Error("Paciente não encontrado ou sem acesso.");
    return data.user_id;
  }

  if (contaInformada && contaInformada !== userId) {
    const { data: permitido } = await client.rpc("pode_acessar_conta", { _dono: contaInformada });
    if (!permitido) throw new Error("Sem acesso a esta conta.");
    return contaInformada;
  }

  return userId;
}

/** Registra quem fez o quê. Gravado apenas pelo servidor — o cliente não escreve nessa tabela. */
export const registrarAuditoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarAuditoria)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const conta = await contaDoRegistro(supabase, userId, data.patientId, data.contaId ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("patient_audit_log").insert({
      user_id: conta,
      autor_user_id: userId,
      patient_id: data.patientId,
      entidade: data.entidade,
      entidade_id: data.entidadeId,
      acao: data.acao,
      detalhe: data.detalhe,
    });
    if (error) {
      console.error("[auditoria] falha ao registrar", error.message);
      throw new Error("Não foi possível registrar o acesso.");
    }
    return { ok: true };
  });

type HistoricoInput = {
  patientId: string;
  alteracoes: { campo: string; anterior: string | null; novo: string | null }[];
};

/** Grava o histórico de alteração de campos da ficha (escrita exclusiva do servidor). */
export const registrarHistoricoCampos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: HistoricoInput) => {
    const patientId = String(input?.patientId ?? "").trim();
    if (!patientId) throw new Error("Paciente inválido.");
    const alteracoes = (input?.alteracoes ?? []).map((a) => ({
      campo: String(a.campo).slice(0, 40),
      anterior: a.anterior ? String(a.anterior).slice(0, 2000) : null,
      novo: a.novo ? String(a.novo).slice(0, 2000) : null,
    }));
    if (!alteracoes.length) throw new Error("Nenhuma alteração informada.");
    return { patientId, alteracoes };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const conta = await contaDoRegistro(supabase, userId, data.patientId, null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("patient_field_history").insert(
      data.alteracoes.map((a) => ({
        patient_id: data.patientId,
        user_id: conta,
        campo: a.campo,
        valor_anterior: a.anterior,
        valor_novo: a.novo,
      })),
    );
    if (error) {
      console.error("[historico-campos] falha ao registrar", error.message);
      throw new Error("Não foi possível registrar o histórico da ficha.");
    }
    await supabaseAdmin.from("patient_audit_log").insert({
      user_id: conta,
      autor_user_id: userId,
      patient_id: data.patientId,
      entidade: "paciente",
      entidade_id: data.patientId,
      acao: "edicao",
      detalhe: data.alteracoes.map((a) => a.campo).join(", "),
    });
    return { ok: true };
  });

/** Link temporário para ouvir a gravação — mesmo modelo usado nos documentos. */
export const urlAudioTriagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { triageId: string }) => {
    const triageId = String(input?.triageId ?? "").trim();
    if (!triageId) throw new Error("Triagem inválida.");
    return { triageId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // RLS garante que só dono ou assistente com vínculo ativo enxerga a linha
    const { data: triagem } = await supabase
      .from("patient_triages")
      .select("id, patient_id, user_id, audio_path")
      .eq("id", data.triageId)
      .maybeSingle();
    if (!triagem?.audio_path) throw new Error("Gravação não encontrada.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: assinado, error } = await supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(triagem.audio_path, 300);
    if (error || !assinado) throw new Error("Não foi possível abrir a gravação.");

    await supabaseAdmin.from("patient_audit_log").insert({
      user_id: triagem.user_id,
      autor_user_id: userId,
      patient_id: triagem.patient_id,
      entidade: "audio_triagem",
      entidade_id: triagem.id,
      acao: "visualizacao",
    });

    return { url: assinado.signedUrl };
  });

/** Apaga o arquivo de áudio de uma triagem, mantendo a transcrição. */
export const excluirAudioTriagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { triageId: string }) => {
    const triageId = String(input?.triageId ?? "").trim();
    if (!triageId) throw new Error("Triagem inválida.");
    return { triageId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: triagem } = await supabase
      .from("patient_triages")
      .select("id, patient_id, user_id, audio_path")
      .eq("id", data.triageId)
      .maybeSingle();
    if (!triagem) throw new Error("Triagem não encontrada.");
    if (triagem.user_id !== userId) throw new Error("Só o dono da conta pode apagar a gravação.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (triagem.audio_path) {
      await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([triagem.audio_path]);
    }
    const { error } = await supabaseAdmin
      .from("patient_triages")
      .update({ audio_path: null })
      .eq("id", triagem.id);
    if (error) throw new Error("Não foi possível apagar a gravação.");

    await supabaseAdmin.from("patient_audit_log").insert({
      user_id: triagem.user_id,
      autor_user_id: userId,
      patient_id: triagem.patient_id,
      entidade: "audio_triagem",
      entidade_id: triagem.id,
      acao: "exclusao",
      detalhe: "gravação apagada manualmente",
    });

    return { ok: true };
  });

/** Exporta tudo o que está guardado sobre um paciente (pedido do titular). */
export const exportarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { patientId: string }) => {
    const patientId = String(input?.patientId ?? "").trim();
    if (!patientId) throw new Error("Paciente inválido.");
    return { patientId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { patientId } = data;

    const { data: paciente } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle();
    if (!paciente) throw new Error("Paciente não encontrado ou sem acesso.");

    const [eventos, triagens, avaliacoes, campos, anexos, minutas, acessos] = await Promise.all([
      supabase.from("patient_events").select("*").eq("patient_id", patientId),
      supabase.from("patient_triages").select("*").eq("patient_id", patientId),
      supabase.from("patient_screenings").select("*").eq("patient_id", patientId),
      supabase.from("patient_field_history").select("*").eq("patient_id", patientId),
      supabase.from("documents").select("id, nome, tag, created_at").eq("patient_id", patientId),
      supabase
        .from("generated_docs")
        .select("id, titulo, tipo, status, conteudo, created_at")
        .eq("patient_id", patientId),
      supabase
        .from("patient_audit_log")
        .select("acao, entidade, detalhe, ocorrido_em")
        .eq("patient_id", patientId)
        .order("ocorrido_em", { ascending: false })
        .limit(500),
    ]);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("patient_audit_log").insert({
      user_id: paciente.user_id,
      autor_user_id: userId,
      patient_id: patientId,
      entidade: "paciente",
      entidade_id: patientId,
      acao: "exportacao_titular",
      detalhe: "exportação completa a pedido do titular",
    });

    return {
      gerado_em: new Date().toISOString(),
      aviso:
        "Exportação completa a pedido do titular. Cópias de segurança da infraestrutura só expiram dentro da janela de retenção do provedor.",
      paciente,
      atendimentos: eventos.data ?? [],
      triagens_por_voz: triagens.data ?? [],
      triagens_estruturadas: avaliacoes.data ?? [],
      historico_de_alteracoes: campos.data ?? [],
      documentos_anexados: anexos.data ?? [],
      minutas_geradas: minutas.data ?? [],
      registro_de_acessos: acessos.data ?? [],
    };
  });

/** Apaga definitivamente o paciente e tudo que está vinculado a ele. */
export const apagarPacienteDefinitivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { patientId: string; confirmacao: string }) => {
    const patientId = String(input?.patientId ?? "").trim();
    const confirmacao = String(input?.confirmacao ?? "").trim();
    if (!patientId) throw new Error("Paciente inválido.");
    if (!confirmacao) throw new Error("Digite o nome do paciente para confirmar.");
    return { patientId, confirmacao };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: paciente } = await supabase
      .from("patients")
      .select("id, nome, user_id")
      .eq("id", data.patientId)
      .maybeSingle();
    if (!paciente) throw new Error("Paciente não encontrado ou sem acesso.");
    if (paciente.user_id !== userId)
      throw new Error("Só o dono da conta pode apagar definitivamente.");
    if (paciente.nome.trim().toLowerCase() !== data.confirmacao.toLowerCase())
      throw new Error("O nome digitado não confere com o do paciente.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: triagens } = await supabaseAdmin
      .from("patient_triages")
      .select("audio_path")
      .eq("patient_id", paciente.id);
    const audios = (triagens ?? []).map((t) => t.audio_path).filter((p): p is string => Boolean(p));
    if (audios.length) await supabaseAdmin.storage.from(AUDIO_BUCKET).remove(audios);

    await supabaseAdmin
      .from("generated_docs")
      .update({ patient_id: null })
      .eq("patient_id", paciente.id);
    await supabaseAdmin
      .from("documents")
      .update({ patient_id: null })
      .eq("patient_id", paciente.id);

    const { error } = await supabaseAdmin.from("patients").delete().eq("id", paciente.id);
    if (error) throw new Error("Não foi possível apagar o paciente.");

    await supabaseAdmin.from("patient_audit_log").insert({
      user_id: paciente.user_id,
      autor_user_id: userId,
      patient_id: null,
      entidade: "paciente",
      entidade_id: paciente.id,
      acao: "exclusao_titular",
      detalhe: `exclusão definitiva a pedido do titular (${paciente.nome})`,
    });

    return { ok: true };
  });
