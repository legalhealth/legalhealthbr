import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PeriodoDias = 7 | 30 | 90;

export type SerieDia = { dia: string; total: number };

export type RelatorioChatbot = {
  conversas: number;
  mensagens: number;
  mediaPorConversa: number;
  conversasComVariasPerguntas: number;
  conversasLogadas: number;
  porDia: SerieDia[];
  lacunas: { pergunta: string; ocorrencias: number }[];
  origens: { fonte: string; total: number }[];
};

export type RelatorioJuriscore = {
  diagnosticos: number;
  scoreMedio: number;
  porFaixa: { faixa: string; total: number }[];
  porPilar: { pilar: string; media: number }[];
  planosGerados: number;
  itensConcluidos: number;
  porDia: SerieDia[];
};

const FAIXAS = [
  { id: "critico", nome: "Crítico", min: 0, max: 25 },
  { id: "exposto", nome: "Exposto", min: 26, max: 50 },
  { id: "evolucao", nome: "Em Evolução", min: 51, max: 75 },
  { id: "protegido", nome: "Protegido", min: 76, max: 100 },
];

function validarPeriodo(input: unknown): { dias: PeriodoDias } {
  const dias = Number((input as { dias?: unknown } | undefined)?.dias ?? 30);
  const valido: PeriodoDias = dias === 7 || dias === 90 ? dias : 30;
  return { dias: valido };
}

function desdeISO(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

function agruparPorDia(datas: string[]): SerieDia[] {
  const mapa = new Map<string, number>();
  for (const d of datas) {
    const dia = d.slice(0, 10);
    mapa.set(dia, (mapa.get(dia) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([dia, total]) => ({ dia, total }))
    .sort((a, b) => (a.dia < b.dia ? -1 : 1));
}

/** Garante papel de administrador antes de qualquer leitura privilegiada. */
async function exigirAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso restrito à equipe administradora.");
}

/** Métricas agregadas do chatbot: nunca retorna texto de conversa. */
export const relatorioChatbot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarPeriodo)
  .handler(async ({ data, context }): Promise<RelatorioChatbot> => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const desde = desdeISO(data.dias);

    const [sessoes, mensagens, threads, lacunas, auditoria] = await Promise.all([
      supabaseAdmin
        .from("chatbot_public_sessions")
        .select("id, created_at")
        .gte("created_at", desde),
      supabaseAdmin
        .from("chatbot_public_messages")
        .select("session_id, role")
        .gte("created_at", desde),
      supabaseAdmin
        .from("chat_threads")
        .select("id, created_at")
        .eq("source", "widget")
        .gte("created_at", desde),
      supabaseAdmin
        .from("legal_qa_lacunas")
        .select("pergunta, ocorrencias")
        .order("ocorrencias", { ascending: false })
        .limit(12),
      supabaseAdmin.from("ai_answer_audit").select("fonte").gte("created_at", desde),
    ]);

    const listaSessoes = sessoes.data ?? [];
    const listaMensagens = mensagens.data ?? [];
    const listaThreads = threads.data ?? [];

    const perguntasPorSessao = new Map<string, number>();
    for (const m of listaMensagens) {
      if (m.role !== "user") continue;
      perguntasPorSessao.set(m.session_id, (perguntasPorSessao.get(m.session_id) ?? 0) + 1);
    }

    const conversas = listaSessoes.length + listaThreads.length;
    const totalMensagens = listaMensagens.length;

    const origens = new Map<string, number>();
    for (const a of auditoria.data ?? []) {
      origens.set(a.fonte, (origens.get(a.fonte) ?? 0) + 1);
    }

    return {
      conversas,
      mensagens: totalMensagens,
      mediaPorConversa: conversas ? Math.round((totalMensagens / conversas) * 10) / 10 : 0,
      conversasComVariasPerguntas: [...perguntasPorSessao.values()].filter((n) => n > 1).length,
      conversasLogadas: listaThreads.length,
      porDia: agruparPorDia([
        ...listaSessoes.map((s) => s.created_at),
        ...listaThreads.map((t) => t.created_at),
      ]),
      lacunas: (lacunas.data ?? []).map((l) => ({
        pergunta: l.pergunta.slice(0, 160),
        ocorrencias: l.ocorrencias,
      })),
      origens: [...origens.entries()]
        .map(([fonte, total]) => ({ fonte, total }))
        .sort((a, b) => b.total - a.total),
    };
  });

/** Métricas agregadas do Juriscore: sem respostas individuais. */
export const relatorioJuriscore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarPeriodo)
  .handler(async ({ data, context }): Promise<RelatorioJuriscore> => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const desde = desdeISO(data.dias);

    const [resultados, planos, itens] = await Promise.all([
      supabaseAdmin
        .from("juriscore_results")
        .select("score, by_pillar, created_at")
        .gte("created_at", desde),
      supabaseAdmin
        .from("action_plans")
        .select("id", { count: "exact", head: true })
        .gte("created_at", desde),
      supabaseAdmin
        .from("action_items_done")
        .select("id", { count: "exact", head: true })
        .eq("done", true)
        .gte("updated_at", desde),
    ]);

    const lista = resultados.data ?? [];
    const soma = lista.reduce((s, r) => s + (r.score ?? 0), 0);

    const somaPilar = new Map<string, { soma: number; n: number }>();
    for (const r of lista) {
      const pilares = (r.by_pillar ?? null) as Record<string, unknown> | null;
      if (!pilares) continue;
      for (const [pilar, valor] of Object.entries(pilares)) {
        const percent =
          typeof valor === "number"
            ? valor
            : typeof (valor as { percent?: unknown })?.percent === "number"
              ? (valor as { percent: number }).percent
              : null;
        if (percent === null) continue;
        const atual = somaPilar.get(pilar) ?? { soma: 0, n: 0 };
        somaPilar.set(pilar, { soma: atual.soma + percent, n: atual.n + 1 });
      }
    }

    return {
      diagnosticos: lista.length,
      scoreMedio: lista.length ? Math.round(soma / lista.length) : 0,
      porFaixa: FAIXAS.map((f) => ({
        faixa: f.nome,
        total: lista.filter((r) => (r.score ?? 0) >= f.min && (r.score ?? 0) <= f.max).length,
      })),
      porPilar: [...somaPilar.entries()].map(([pilar, v]) => ({
        pilar,
        media: v.n ? Math.round(v.soma / v.n) : 0,
      })),
      planosGerados: planos.count ?? 0,
      itensConcluidos: itens.count ?? 0,
      porDia: agruparPorDia(lista.map((r) => r.created_at)),
    };
  });
