import { createFileRoute } from "@tanstack/react-router";

import { corsHeaders, guardAiRequest, jsonError, upstreamError } from "@/lib/ai-gateway.server";
import { systemPromptFor } from "@/lib/ai-prompts.server";
import {
  CLAUDE_DOC_MIMES,
  CLAUDE_IMAGE_MIMES,
  streamJuridico,
  type ClaudeAttachment,
} from "@/lib/anthropic.server";

const MAX_ARQUIVOS = 4;
const MAX_TOTAL_BASE64 = 28 * 1024 * 1024; // ~20 MB de arquivo

function parseArquivos(raw: unknown): ClaudeAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: ClaudeAttachment[] = [];
  let total = 0;
  for (const item of raw.slice(0, MAX_ARQUIVOS)) {
    const a = (item ?? {}) as { nome?: unknown; mime?: unknown; dataUrl?: unknown };
    if (typeof a.dataUrl !== "string") continue;
    const m = /^data:([^;]+);base64,(.+)$/s.exec(a.dataUrl);
    if (!m) continue;
    const mime = (typeof a.mime === "string" && a.mime) || m[1];
    if (![...CLAUDE_DOC_MIMES, ...CLAUDE_IMAGE_MIMES].includes(mime)) continue;
    total += m[2].length;
    if (total > MAX_TOTAL_BASE64) break;
    out.push({ nome: typeof a.nome === "string" ? a.nome : "documento", mime, base64: m[2] });
  }
  return out;
}

type DocPayload = {
  nome?: unknown;
  tipo_documento?: unknown;
  partes?: unknown;
  prazos?: unknown;
  pontos?: unknown;
  transcricao?: unknown;
};

function str(value: unknown, max = 8000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, max = 30): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().slice(0, 4000))
    .slice(0, max);
}

function docBlocks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map((item, index) => {
    const d = (item ?? {}) as DocPayload;
    const partes = list(d.partes);
    const prazos = list(d.prazos);
    const pontos = list(d.pontos);
    const transcricao = list(d.transcricao, 60);
    return [
      `--- DOCUMENTO ${index + 1}: ${str(d.nome, 200) || "documento anexado"} ---`,
      `Tipo identificado na leitura: ${str(d.tipo_documento, 200) || "[NÃO IDENTIFICADO]"}`,
      partes.length > 0 ? `Partes envolvidas: ${partes.join("; ")}` : "",
      prazos.length > 0 ? `Prazos detectados: ${prazos.join("; ")}` : "",
      pontos.length > 0 ? `Pontos críticos:\n${pontos.map((p) => `- ${p}`).join("\n")}` : "",
      transcricao.length > 0
        ? `Conteúdo extraído do documento:\n${transcricao.join("\n")}`
        : "Conteúdo extraído do documento: [ILEGÍVEL OU NÃO EXTRAÍDO]",
    ]
      .filter(Boolean)
      .join("\n");
  });
}

function buildUserPrompt(body: Record<string, unknown>): string {
  const tipo = str(body["tipo"], 200);
  const complemento = str(body["complemento"]);
  const contexto = str(body["contexto"]);
  return [
    "Leia os documentos abaixo, identifique a medida jurídica cabível e redija a defesa técnica completa.",
    "",
    tipo
      ? `Tipo de peça definido pelo usuário (respeite): ${tipo}`
      : "Tipo de peça: NÃO INFORMADO — identifique você mesmo a peça cabível e o órgão de destino a partir dos documentos.",
    "",
    ...docBlocks(body["documentos"]),
    "",
    complemento ? `Informações adicionais do profissional:\n${complemento}` : "",
    contexto ? `Contexto de conformidade (Juriscore®):\n${contexto}` : "",
    "",
    "Entregue apenas o texto da peça, pronto para revisão do advogado responsável.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export const Route = createFileRoute("/api/ai-peca")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-peca");
        if (!guard.ok) return guard.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const blocks = docBlocks(body["documentos"]);
        const complemento = str(body["complemento"]);
        if (blocks.length === 0 && complemento.length < 20) {
          return jsonError(
            "Anexe o documento que originou o caso ou descreva o caso com mais detalhes.",
            400,
          );
        }

        const arquivos = parseArquivos(body["arquivos"]);

        let upstream: Response;
        try {
          upstream = await streamJuridico({
            system: systemPromptFor("peca"),
            user: buildUserPrompt(body),
            gatewayKey: guard.apiKey,
            attachments: arquivos,
            signal: request.signal,
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-peca", detail);
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-store",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
