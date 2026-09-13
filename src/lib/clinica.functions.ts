import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

type ConviteInput = { email: string; nome?: string };

function gerarToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cria (ou renova) o convite do assistente e envia o link por e-mail. */
export const convidarAssistente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ConviteInput) => {
    const email = String(input?.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
    return { email, nome: String(input?.nome ?? "").trim() || null };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = gerarToken();

    const { data: convite, error } = await supabase
      .from("clinic_invites")
      .insert({
        medico_user_id: userId,
        email: data.email,
        nome: data.nome,
        token,
        status: "pendente",
      })
      .select("id, token, expires_at")
      .single();
    if (error || !convite) throw new Error("Não foi possível criar o convite.");

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome, clinica")
      .eq("user_id", userId)
      .maybeSingle();

    const origem = process.env["PUBLIC_SITE_URL"] ?? "https://legalhealthbr.app";
    const link = `${origem}/convite/${convite.token}`;
    const medico = perfil?.nome || perfil?.clinica || "Sua clínica";

    let enviado = true;
    let aviso: string | null = null;
    try {
      await sendTemplateEmail({
        to: data.email,
        subject: `${medico} convidou você para a Legal Health`,
        html: `<p>Olá${data.nome ? ` ${data.nome}` : ""},</p>
<p><strong>${medico}</strong> convidou você para acessar a área de pacientes da Legal Health como assistente da clínica.</p>
<p>Com esse acesso você pode ver e cadastrar fichas e registrar triagens — sem entrar na conta do médico e sem acesso à assinatura ou às configurações dele.</p>
<p><a href="${link}">Aceitar o convite</a></p>
<p>O convite vale por 7 dias. Se você não esperava este e-mail, ignore esta mensagem.</p>`,
      });
    } catch (e) {
      enviado = false;
      aviso = e instanceof Error ? e.message : "Falha ao enviar o e-mail.";
    }

    return { id: convite.id, link, enviado, aviso };
  });

/** Aceita o convite e cria o vínculo (precisa de privilégio: o convidado não é dono da linha). */
export const aceitarConvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) => {
    const token = String(input?.token ?? "").trim();
    if (!token) throw new Error("Convite inválido.");
    return { token };
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = String((claims as { email?: string })?.email ?? "").toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: convite } = await supabaseAdmin
      .from("clinic_invites")
      .select("id, medico_user_id, email, nome, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!convite) throw new Error("Convite não encontrado.");
    if (convite.status !== "pendente") throw new Error("Este convite já foi usado ou cancelado.");
    if (new Date(convite.expires_at).getTime() < Date.now())
      throw new Error("Este convite expirou. Peça um novo ao médico responsável.");
    if (email && convite.email.toLowerCase() !== email)
      throw new Error("Este convite foi enviado para outro e-mail.");
    if (convite.medico_user_id === userId)
      throw new Error("Você não pode aceitar o próprio convite.");

    const { error: vinculoError } = await supabaseAdmin.from("clinic_members").upsert(
      {
        medico_user_id: convite.medico_user_id,
        assistente_user_id: userId,
        nome: convite.nome,
        status: "ativo",
      },
      { onConflict: "medico_user_id,assistente_user_id" },
    );
    if (vinculoError) throw new Error("Não foi possível criar o acesso.");

    await supabaseAdmin
      .from("clinic_invites")
      .update({ status: "aceito", accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq("id", convite.id);

    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("nome, clinica")
      .eq("user_id", convite.medico_user_id)
      .maybeSingle();

    return {
      medicoUserId: convite.medico_user_id as string,
      medico: perfil?.nome || perfil?.clinica || "Clínica",
    };
  });
