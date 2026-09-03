import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/**
 * Acesso público por token ao pacote de revisão enviado ao advogado:
 * intimação anexada (links assinados na hora) + Juriscore do médico.
 * Nenhum login é exigido; o token expira e pode ser revogado.
 */
export const Route = createFileRoute("/api/public/revisao/$token")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        const token = String(params.token ?? "").trim();
        if (token.length < 16 || token.length > 96 || !/^[a-f0-9]+$/i.test(token)) {
          return json({ error: "Link inválido." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: tokenRow } = await supabaseAdmin
          .from("revisao_tokens")
          .select("id, revisao_id, expires_at, revoked_at, opens")
          .eq("token", token)
          .maybeSingle();

        if (!tokenRow) return json({ error: "Link não encontrado ou já removido." }, 404);
        if (tokenRow.revoked_at) return json({ error: "Este link foi revogado pelo solicitante." }, 410);
        if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
          return json({ error: "Este link expirou. Solicite um novo envio ao médico." }, 410);
        }

        const { data: revisao } = await supabaseAdmin
          .from("revisoes")
          .select(
            "id, user_id, doc_id, advogado_nome, advogado_oab, advogado_email, mensagem, status, document_ids, enviado_em, parecer, parecer_em",
          )
          .eq("id", tokenRow.revisao_id)
          .maybeSingle();
        if (!revisao) return json({ error: "Revisão não encontrada." }, 404);

        const { data: doc } = await supabaseAdmin
          .from("generated_docs")
          .select("titulo, tipo, conteudo")
          .eq("id", revisao.doc_id)
          .maybeSingle();

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("nome, crm, especialidade, cidade, clinica")
          .eq("user_id", revisao.user_id)
          .maybeSingle();

        const { data: juriscore } = await supabaseAdmin
          .from("juriscore_results")
          .select("score, by_pillar, created_at")
          .eq("user_id", revisao.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const documentIds = (revisao.document_ids ?? []) as string[];
        const anexos: { nome: string; tag: string; url: string; texto: string | null }[] = [];
        if (documentIds.length > 0) {
          const { data: docs } = await supabaseAdmin
            .from("documents")
            .select("id, nome, tag, storage_path, texto")
            .in("id", documentIds);
          for (const item of docs ?? []) {
            const { data: signed } = await supabaseAdmin.storage
              .from("documents")
              .createSignedUrl(item.storage_path, 60 * 60 * 6);
            anexos.push({
              nome: item.nome,
              tag: item.tag,
              url: signed?.signedUrl ?? "",
              texto: item.texto ? item.texto.slice(0, 6000) : null,
            });
          }
        }

        const { data: comentarios } = await supabaseAdmin
          .from("revisao_comentarios")
          .select("id, autor, papel, conteudo, created_at")
          .eq("revisao_id", revisao.id)
          .order("created_at", { ascending: true });

        await supabaseAdmin
          .from("revisao_tokens")
          .update({
            opens: (tokenRow.opens ?? 0) + 1,
            first_opened_at: tokenRow.opens > 0 ? undefined : new Date().toISOString(),
          })
          .eq("id", tokenRow.id);

        return json({
          revisao: {
            id: revisao.id,
            status: revisao.status,
            mensagem: revisao.mensagem,
            enviado_em: revisao.enviado_em,
            advogado_nome: revisao.advogado_nome,
            advogado_oab: revisao.advogado_oab,
            parecer: revisao.parecer,
            parecer_em: revisao.parecer_em,
          },
          peca: {
            titulo: doc?.titulo ?? "Peça jurídica",
            tipo: doc?.tipo ?? null,
            conteudo: doc?.conteudo ?? "",
          },
          medico: {
            nome: profile?.nome ?? "Profissional Legal Health",
            crm: profile?.crm ?? null,
            especialidade: profile?.especialidade ?? null,
            cidade: profile?.cidade ?? null,
            clinica: profile?.clinica ?? null,
          },
          juriscore: juriscore
            ? {
                score: juriscore.score,
                by_pillar: juriscore.by_pillar,
                created_at: juriscore.created_at,
              }
            : null,
          anexos,
          comentarios: comentarios ?? [],
          expira_em: tokenRow.expires_at,
        });
      },
    },
  },
});
