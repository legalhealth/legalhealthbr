export type BibliotecaCategoria = "minutas" | "protocolos" | "checklists";

export type BibliotecaDoc = {
  value: string;
  label: string;
  /** pede o campo "Procedimento" no formulário */
  procedimento?: boolean;
  /** subtítulo discreto exibido acima dos chips na tela */
  grupo?: string;
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
      { value: "tcle", label: "Termo de Consentimento (TCLE)", procedimento: true, grupo: "Documentos essenciais" },
      { value: "contrato-servicos", label: "Contrato de Prestação de Serviços Médicos", grupo: "Documentos essenciais" },
      { value: "aviso-lgpd", label: "Aviso de Privacidade LGPD para Pacientes", grupo: "Documentos essenciais" },
      { value: "tcle-teleconsulta", label: "Termo de Consentimento para Teleconsulta", grupo: "Documentos essenciais" },
      { value: "uso-imagem", label: "Autorização de Uso de Imagem (padrão CFM)", procedimento: true, grupo: "Documentos essenciais" },

      { value: "consentimento-estetica", label: "Consentimento para Procedimentos Estéticos", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-cirurgico", label: "Consentimento Cirúrgico", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-sedacao", label: "Consentimento para Sedação/Anestesia", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-exames-invasivos", label: "Consentimento para Exames Invasivos", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-odontologico", label: "Consentimento para Tratamento Odontológico", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-fisioterapia", label: "Consentimento para Fisioterapia", procedimento: true, grupo: "Consentimentos por especialidade" },
      { value: "consentimento-vacinacao", label: "Consentimento para Vacinação", grupo: "Consentimentos por especialidade" },

      { value: "contrato-parceria", label: "Contrato de Parceria entre Clínicas/Profissionais", grupo: "Contratos e institucional" },
      { value: "contrato-locacao-consultorio", label: "Contrato de Locação de Consultório", grupo: "Contratos e institucional" },
      { value: "termo-no-show", label: "Termo de Responsabilidade por Não Comparecimento (No-show)", grupo: "Contratos e institucional" },
      { value: "termo-quitacao-alta", label: "Termo de Quitação e Alta Médica", grupo: "Contratos e institucional" },
      { value: "contrato-telemedicina", label: "Contrato para Plataformas de Telemedicina", grupo: "Contratos e institucional" },
      { value: "termo-sigilo-equipe", label: "Termo de Sigilo (NDA) para Equipe", grupo: "Contratos e institucional" },

      { value: "uso-imagem-marketing", label: "Consentimento para Uso de Imagem em Marketing/Redes Sociais", grupo: "LGPD e dados" },
      { value: "aviso-privacidade-prontuario", label: "Aviso de Privacidade para Prontuário Eletrônico", grupo: "LGPD e dados" },
      { value: "compartilhamento-dados-convenios", label: "Termo de Compartilhamento de Dados com Convênios", grupo: "LGPD e dados" },
      { value: "anuencia-pesquisa-cientifica", label: "Termo de Anuência para Pesquisa Científica", grupo: "LGPD e dados" },
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

/**
 * Docs da categoria agrupados por `grupo`, na ordem de declaração.
 * Itens sem `grupo` formam um único bloco com rótulo vazio (sem subtítulo).
 */
export function gruposDaCategoria(
  categoria: BibliotecaCategoria,
): { label: string; docs: BibliotecaDoc[] }[] {
  const grupos: { label: string; docs: BibliotecaDoc[] }[] = [];
  for (const doc of docsDaCategoria(categoria)) {
    const label = doc.grupo ?? "";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.label === label) ultimo.docs.push(doc);
    else grupos.push({ label, docs: [doc] });
  }
  return grupos;
}
