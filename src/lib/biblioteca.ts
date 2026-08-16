import { streamAiEndpoint } from "@/lib/ia-chat";

export type BibliotecaCategoria = "minutas" | "protocolos" | "checklists";

export type BibliotecaDoc = {
  value: string;
  label: string;
  /** pede o campo "Procedimento" no formulário */
  procedimento?: boolean;
};

export const BIBLIOTECA_CATEGORIAS: {
  value: BibliotecaCategoria;
  label: string;
  docs: BibliotecaDoc[];
}[] = [
  {
    value: "minutas",
    label: "Minutas",
    docs: [
      { value: "tcle", label: "Termo de Consentimento (TCLE)", procedimento: true },
      { value: "contrato-servicos", label: "Contrato de Prestação de Serviços Médicos" },
      { value: "aviso-lgpd", label: "Aviso de Privacidade LGPD para Pacientes" },
      { value: "tcle-teleconsulta", label: "Termo de Consentimento para Teleconsulta" },
      { value: "uso-imagem", label: "Autorização de Uso de Imagem (padrão CFM)", procedimento: true },
    ],
  },
  {
    value: "protocolos",
    label: "Protocolos",
    docs: [
      { value: "intercorrencias", label: "Protocolo de Intercorrências e Eventos Adversos" },
      { value: "protecao-dados", label: "Protocolo Interno de Proteção de Dados (LGPD)" },
      { value: "reclamacoes", label: "Fluxo de Tratamento de Reclamações de Pacientes" },
      { value: "comunicacao", label: "Protocolo de Comunicação com Pacientes (WhatsApp e canais)" },
    ],
  },
  {
    value: "checklists",
    label: "Checklists",
    docs: [
      { value: "conformidade-consultorio", label: "Checklist de Conformidade do Consultório" },
      { value: "publicidade-medica", label: "Checklist de Publicidade Médica (CFM)" },
      { value: "adequacao-lgpd", label: "Checklist de Adequação à LGPD" },
      { value: "pre-procedimento", label: "Checklist Pré-Procedimento de Risco", procedimento: true },
    ],
  },
];

export function categoriaLabel(value: string): string {
  return BIBLIOTECA_CATEGORIAS.find((c) => c.value === value)?.label ?? "Documento";
}

export function docsDaCategoria(categoria: BibliotecaCategoria): BibliotecaDoc[] {
  return BIBLIOTECA_CATEGORIAS.find((c) => c.value === categoria)?.docs ?? [];
}

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
