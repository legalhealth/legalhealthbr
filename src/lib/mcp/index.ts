import { auth, defineMcp } from "@lovable.dev/mcp-js";
import type { AnyToolDefinition } from "@lovable.dev/mcp-js";

import gerarDocumentoBiblioteca from "./tools/gerar-documento-biblioteca";
import listarDocumentosGerados from "./tools/listar-documentos-biblioteca";
import listarModelosBiblioteca from "./tools/listar-modelos-biblioteca";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "legal-health",
  title: "Legal health",
  version: "0.1.0",
  instructions:
    "Ferramentas da Legal Health, plataforma de inteligência jurídica para medicina no Brasil. Use `listar_modelos_biblioteca` para descobrir os modelos da Biblioteca Inteligente, `gerar_documento_biblioteca` para gerar minutas, protocolos e checklists personalizados (salvos no histórico do usuário) e `listar_documentos_gerados` para consultar o histórico. Todo conteúdo gerado é sujeito à revisão do advogado responsável.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listarModelosBiblioteca, gerarDocumentoBiblioteca, listarDocumentosGerados] as unknown as AnyToolDefinition[],
});
