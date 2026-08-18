import { streamAiEndpoint } from "@/lib/ia-chat";
import { categoriaLabel } from "@/lib/biblioteca-catalogo";
import type { BibliotecaCategoria } from "@/lib/biblioteca-catalogo";

export {
  BIBLIOTECA_CATEGORIAS,
  categoriaLabel,
  docsDaCategoria,
} from "@/lib/biblioteca-catalogo";
export type { BibliotecaCategoria, BibliotecaDoc } from "@/lib/biblioteca-catalogo";

export type BibliotecaInput = {
  categoria: BibliotecaCategoria;
  documento: string;
  nome: string;
  crm: string;
  especialidade: string;
  cidade: string;
  procedimento?: string;
};

/** Gera o documento via rota protegida /api/ai-biblioteca (chave de IA só no servidor). */
export function streamBibliotecaDoc(
  input: BibliotecaInput & { documentoLabel: string },
  onDelta: (chunk: string) => void,
): Promise<string> {
  return streamAiEndpoint(
    "/api/ai-biblioteca",
    {
      categoria: categoriaLabel(input.categoria),
      documento: input.documentoLabel,
      nome: input.nome,
      crm: input.crm,
      especialidade: input.especialidade,
      cidade: input.cidade,
      procedimento: input.procedimento ?? "",
    },
    onDelta,
  );
}
