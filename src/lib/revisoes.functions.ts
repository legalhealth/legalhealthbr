import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

type Input = {
  revisaoId: string;
  titulo: string;
  conteudo: string;
};

/** Envia a revisão ao advogado por e-mail (links assinados dos anexos incluídos). */
export const enviarRevisaoEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input?.revisaoId) throw new Error("Revisão inválida.");
    return {
      revisaoId: String(input.revisaoId),
      titulo: String(input.titulo ?? "Peça jurídica"),
      conteudo: String(input.conteudo ?? ""),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: revisao, error } = await supabase
      .from("revisoes")
      .select(
        "id, advogado_nome, advogado_email, advogado_oab, mensagem, document_ids, enviado_em",
      )
      .eq("id", data.revisaoId)
      .eq("user_id", userId)
      .single();
    if (error || !revisao) throw new Error("Revisão não encontrada.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, clinica")
      .eq("id", userId)
      .maybeSingle();
    const medicoEmail =
      typeof (context.claims as Record<string, unknown> | undefined)?.['email'] === "string"
        ? ((context.claims as Record<string, unknown>)['email'] as string)
        : undefined;


    const documentIds = (revisao.document_ids ?? []) as string[];
    const anexos: { nome: string; url: string }[] = [];
    if (documentIds.length > 0) {
      const { data: docs } = await supabase
        .from("documents")
        .select("id, nome, storage_path")
        .in("id", documentIds);
      for (const doc of docs ?? []) {
        const { data: signed } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.storage_path, 60 * 60 * 24);
        if (signed?.signedUrl) anexos.push({ nome: doc.nome, url: signed.signedUrl });
      }
    }

    const tentativaEm = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
    });

    /** Avisa o médico por e-mail quando a entrega ao advogado não é aceita. */
    const avisarFalha = async (motivo: string) => {
      if (!medicoEmail) return false;
      try {
        const aviso = await sendTemplateEmail("revisao-falha", medicoEmail, {
          idempotencyKey: `revisao-falha-${revisao.id}-${Date.now()}`,
          templateData: {
            medicoNome: profile?.nome ?? "Profissional Legal Health",
            advogadoNome: revisao.advogado_nome,
            advogadoEmail: revisao.advogado_email,
            titulo: data.titulo,
            protocolo: revisao.id,
            tentativaEm,
            motivo,
          },
        });
        return aviso.sent;
      } catch {
        return false;
      }
    };

    // Link público seguro (7 dias) para o advogado abrir a revisão sem login.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let origin = "https://legalhealthbr.app";
    try {
      origin = new URL(getRequest().url).origin;
    } catch {
      /* mantém o domínio padrão */
    }

    const agoraIso = new Date().toISOString();
    let token: string | null = null;
    const { data: tokenExistente } = await supabaseAdmin
      .from("revisao_tokens")
      .select("token, expires_at, revoked_at")
      .eq("revisao_id", revisao.id)
      .is("revoked_at", null)
      .gt("expires_at", agoraIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenExistente?.token) {
      token = tokenExistente.token;
    } else {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const novoToken = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const { error: tokenError } = await supabaseAdmin
        .from("revisao_tokens")
        .insert({ revisao_id: revisao.id, token: novoToken });
      if (tokenError) {
        console.error("revisao_tokens insert error", tokenError);
      } else {
        token = novoToken;
      }
    }

    const link = token ? `${origin}/revisao/${token}` : null;

    let result: { sent: boolean; reason?: string };
    try {
      result = await sendTemplateEmail("revisao-advogado", revisao.advogado_email, {
        idempotencyKey: `revisao-advogado-${revisao.id}`,
        ...(medicoEmail ? { replyTo: medicoEmail } : {}),
        templateData: {
          advogadoNome: revisao.advogado_nome,
          medicoNome: profile?.nome ?? "Profissional Legal Health",
          medicoEmail,
          titulo: data.titulo,
          mensagem: revisao.mensagem ?? undefined,
          conteudo: data.conteudo,
          protocolo: revisao.id,
          enviadoEm: new Date(revisao.enviado_em).toLocaleString("pt-BR", {
            timeZone: "America/Fortaleza",
          }),
          anexos,
          link,
        },
      });
    } catch (error) {
      const codigo =
        typeof (error as { code?: unknown })?.code === "string"
          ? ((error as { code: string }).code)
          : undefined;
      const motivo =
        codigo === "domain_not_verified"
          ? "O domínio de envio da plataforma ainda está em verificação."
          : codigo === "emails_disabled"
            ? "O envio de e-mails da plataforma está desativado."
            : (error as { status?: number })?.status === 429
              ? "Limite temporário de envios atingido. Tente novamente em alguns minutos."
              : "O provedor de e-mail recusou a entrega nesta tentativa.";
      const avisoEnviado = await avisarFalha(motivo);
      return {
        sent: false as const,
        reason: codigo ?? "send_failed",
        motivo,
        avisoEnviado,
        avisoDestinatario: medicoEmail ?? null,
        confirmadoEm: null,
        anexos: anexos.length,
        destinatario: revisao.advogado_email,
      };
    }

    if (!result.sent) {
      const motivo =
        "O endereço do advogado está bloqueado por histórico de falha de entrega (retorno, spam ou cancelamento).";
      const avisoEnviado = await avisarFalha(motivo);
      return {
        sent: false as const,
        reason: result.reason ?? "recipient_suppressed",
        motivo,
        avisoEnviado,
        avisoDestinatario: medicoEmail ?? null,
        confirmadoEm: null,
        anexos: anexos.length,
        destinatario: revisao.advogado_email,
      };
    }

    // Só chega aqui depois de o provedor aceitar a mensagem para entrega.
    return {
      sent: true as const,
      reason: null,
      motivo: null,
      avisoEnviado: false,
      avisoDestinatario: medicoEmail ?? null,
      confirmadoEm: tentativaEm,
      anexos: anexos.length,
      destinatario: revisao.advogado_email,
      link,
    };
  });
