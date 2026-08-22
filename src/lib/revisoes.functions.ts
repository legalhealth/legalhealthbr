import { createServerFn } from "@tanstack/react-start";

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

    const result = await sendTemplateEmail("revisao-advogado", revisao.advogado_email, {
      idempotencyKey: `revisao-advogado-${revisao.id}`,
      ...(profile?.email ? { replyTo: profile.email } : {}),
      templateData: {
        advogadoNome: revisao.advogado_nome,
        medicoNome: profile?.full_name ?? "Profissional Legal Health",
        medicoEmail: profile?.email ?? undefined,
        titulo: data.titulo,
        mensagem: revisao.mensagem ?? undefined,
        conteudo: data.conteudo,
        protocolo: revisao.id,
        enviadoEm: new Date(revisao.enviado_em).toLocaleString("pt-BR", {
          timeZone: "America/Fortaleza",
        }),
        anexos,
      },
    });

    return {
      sent: result.sent,
      reason: result.sent ? null : result.reason,
      anexos: anexos.length,
      destinatario: revisao.advogado_email,
    };
  });
