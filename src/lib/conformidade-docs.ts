import type { Clinica } from "@/lib/clinica";

/** Versão e data das minutas de conformidade exibidas na Biblioteca. */
export const CONFORMIDADE_VERSAO = "Versão 1 — 15/09/2026";
export const CONFORMIDADE_AVISO =
  "Minuta gerada pela plataforma para revisão do advogado. Não é documento assinado nem parecer jurídico.";

export type Bloco = { titulo: string; paragrafos: string[] };

export type ConformidadeDoc = {
  slug: "retencao" | "contrato-lgpd";
  titulo: string;
  resumo: string;
  arquivo: string;
  blocos: Bloco[];
};

const PREENCHER = "[preencher]";

export type CampoClinica = {
  chave: keyof Clinica;
  rotulo: string;
};

/** Campos usados nos documentos; o que faltar aparece marcado para preencher. */
export const CAMPOS_CLINICA: CampoClinica[] = [
  { chave: "nome", rotulo: "Nome da clínica" },
  { chave: "cnpj", rotulo: "CNPJ" },
  { chave: "responsavel_tecnico", rotulo: "Responsável técnico(a)" },
  { chave: "email", rotulo: "E-mail de contato" },
  { chave: "telefone", rotulo: "Telefone" },
  { chave: "logradouro", rotulo: "Endereço" },
  { chave: "cidade", rotulo: "Cidade" },
  { chave: "uf", rotulo: "UF" },
];

export function camposFaltantes(clinica: Clinica | null | undefined): string[] {
  return CAMPOS_CLINICA.filter(({ chave }) => {
    const valor = clinica?.[chave];
    return typeof valor !== "string" || valor.trim() === "";
  }).map((c) => c.rotulo);
}

function valor(clinica: Clinica | null | undefined, chave: keyof Clinica): string {
  const bruto = clinica?.[chave];
  return typeof bruto === "string" && bruto.trim() !== "" ? bruto.trim() : PREENCHER;
}

function enderecoCompleto(clinica: Clinica | null | undefined): string {
  const partes = [
    clinica?.logradouro,
    clinica?.numero,
    clinica?.complemento,
    clinica?.bairro,
    [clinica?.cidade, clinica?.uf].filter(Boolean).join("/"),
    clinica?.cep ? `CEP ${clinica.cep}` : null,
  ]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p !== "");
  return partes.length > 0 ? partes.join(", ") : PREENCHER;
}

function identificacao(clinica: Clinica | null | undefined): string[] {
  return [
    `Clínica ou profissional titular da conta: ${valor(clinica, "nome")}.`,
    `CNPJ: ${valor(clinica, "cnpj")}.`,
    `Responsável técnico(a): ${valor(clinica, "responsavel_tecnico")}.`,
    `Endereço: ${enderecoCompleto(clinica)}.`,
    `Contato: ${valor(clinica, "email")} · ${valor(clinica, "telefone")}.`,
    "Plataforma: Legal Health — Inteligência jurídica para saúde.",
  ];
}

/** Política de retenção de dados, com os dados da clínica aplicados. */
export function docRetencao(clinica: Clinica | null | undefined): ConformidadeDoc {
  return {
    slug: "retencao",
    titulo: "Política de Retenção de Dados",
    resumo:
      "O que a plataforma guarda, por quanto tempo, quem acessa e como se apaga definitivamente.",
    arquivo: "politica-retencao-dados-legal-health",
    blocos: [
      { titulo: "Identificação", paragrafos: identificacao(clinica) },
      {
        titulo: "1. Objeto",
        paragrafos: [
          "Esta política descreve os critérios de guarda e de eliminação dos registros inseridos na plataforma Legal Health pela clínica ou pelo profissional de saúde titular da conta.",
          "Aplica-se a dados pessoais e a dados pessoais sensíveis de saúde de pacientes, responsáveis legais e integrantes da equipe.",
        ],
      },
      {
        titulo: "2. O que é guardado",
        paragrafos: [
          "Ficha do paciente: identificação, contato, data de nascimento, convênio, responsável legal e observações, além do histórico de cada alteração desses campos.",
          "Atendimentos e eventos do histórico documental e procedimental, sem prazo de expiração.",
          "Triagens administrativas por voz: transcrição, resumo organizado, prioridade e encaminhamento; a gravação de áudio só é guardada quando o titular autoriza expressamente antes do início.",
          "Triagens por formulário: queixa, sintomas, histórico, medicações, exames, sinais de alerta, fatores de risco e classificação de risco.",
          "Documentos anexados e minutas geradas, vinculados ao paciente.",
          "Registro de acessos e de edições, com autor, data e ação, para fins de auditoria.",
        ],
      },
      {
        titulo: "3. Prazo de guarda",
        paragrafos: [
          "Os registros permanecem disponíveis enquanto a conta existir. Não há expiração automática: nenhum dado é apagado pela plataforma por decurso de prazo.",
          "A guarda por prazo indeterminado atende à necessidade de comprovar a regularidade documental do atendimento e acompanha os prazos de guarda de prontuário e de prescrição aplicáveis à atividade médica.",
          "A eliminação é sempre um ato do titular da conta, feito na própria ficha do paciente.",
        ],
      },
      {
        titulo: "4. Quem acessa",
        paragrafos: [
          "O profissional titular da conta acessa todos os registros que inseriu.",
          "O assistente convidado pela clínica, com vínculo ativo, acessa fichas, atendimentos, triagens, gravações e documentos vinculados a pacientes da mesma conta; não acessa outras contas nem exclui registros.",
          "Todo acesso a arquivo sensível ocorre por link temporário emitido pelo servidor, com validade curta, e fica registrado no log de auditoria.",
        ],
      },
      {
        titulo: "5. Exclusão a pedido do titular",
        paragrafos: [
          "Na ficha do paciente é possível exportar todos os dados dele em um único arquivo e apagar definitivamente a ficha, com confirmação pelo nome do paciente.",
          "A exclusão definitiva remove ficha, atendimentos, triagens, avaliações, gravações de áudio e o vínculo dos documentos gerados, e é registrada como pedido do titular com data e autor.",
          "Gravações de áudio podem ser apagadas individualmente, mantendo a transcrição, quando esta for necessária ao histórico.",
        ],
      },
      {
        titulo: "6. Cópias de segurança",
        paragrafos: [
          "Após a exclusão, cópias de segurança da infraestrutura podem conter o registro até expirarem dentro da janela de retenção do provedor de hospedagem, sem qualquer acesso pela aplicação.",
        ],
      },
      {
        titulo: "7. Serviço de inteligência artificial",
        paragrafos: [
          "A transcrição e a organização das triagens usam serviço de inteligência artificial contratado, sem uso do conteúdo para treinamento de modelos.",
          "A análise gerada é sempre administrativa e exige revisão humana: a plataforma não diagnostica nem indica conduta clínica.",
        ],
      },
      {
        titulo: "8. Revisão desta política",
        paragrafos: [
          "Esta política é revista sempre que houver mudança nas finalidades de tratamento, nos prazos legais aplicáveis ou nos provedores utilizados.",
          `Responsável pela revisão jurídica: ${PREENCHER}. Encarregado de proteção de dados: ${PREENCHER}.`,
        ],
      },
    ],
  };
}

/** Contrato de tratamento de dados (LGPD) entre a clínica e a plataforma. */
export function docContratoLgpd(clinica: Clinica | null | undefined): ConformidadeDoc {
  return {
    slug: "contrato-lgpd",
    titulo: "Contrato de Tratamento de Dados Pessoais (LGPD)",
    resumo:
      "Papéis de controlador e operador, finalidades, segurança, incidentes e encerramento do tratamento.",
    arquivo: "contrato-tratamento-dados-lgpd-legal-health",
    blocos: [
      { titulo: "Identificação das partes", paragrafos: identificacao(clinica) },
      {
        titulo: "1. Partes e papéis",
        paragrafos: [
          `Controlador: ${valor(clinica, "nome")}, clínica ou profissional de saúde titular da conta, que decide quais dados de pacientes insere na plataforma e para quais finalidades.`,
          "Operador: Legal Health, que trata os dados exclusivamente conforme as instruções do Controlador e para as finalidades deste contrato.",
        ],
      },
      {
        titulo: "2. Objeto",
        paragrafos: [
          "Tratamento de dados pessoais e de dados pessoais sensíveis de saúde inseridos pelo Controlador na plataforma, para cadastro de pacientes, histórico documental e procedimental, triagem administrativa por voz ou formulário, geração de minutas e registro de acessos.",
        ],
      },
      {
        titulo: "3. Natureza dos dados e titulares",
        paragrafos: [
          "Titulares: pacientes, responsáveis legais e integrantes da equipe da clínica.",
          "Categorias: identificação e contato, convênio, responsável legal, observações, relatos de triagem, transcrição e gravação de áudio quando autorizada pelo titular, documentos gerados e anexados.",
          "Dados sensíveis de saúde estão incluídos; a base legal é indicada pelo Controlador, em regra tutela da saúde por profissional de saúde ou consentimento do titular.",
        ],
      },
      {
        titulo: "4. Obrigações do Operador",
        paragrafos: [
          "Tratar os dados apenas conforme as instruções documentadas do Controlador e as finalidades deste contrato.",
          "Manter segregação de acesso por conta, de modo que nenhuma conta alcance dados de outra.",
          "Registrar acessos, edições e exclusões com autor, data e ação.",
          "Emitir acesso a arquivos sensíveis apenas por link temporário, com validade curta.",
          "Manter confidencialidade e vincular a ela toda pessoa com acesso técnico.",
          "Auxiliar o Controlador no atendimento a pedidos de titulares e de autoridades.",
        ],
      },
      {
        titulo: "5. Obrigações do Controlador",
        paragrafos: [
          "Definir a base legal do tratamento e obter o consentimento quando exigido, inclusive para a gravação de áudio da triagem.",
          "Inserir apenas dados necessários à finalidade e manter a equipe orientada sobre sigilo.",
          "Gerenciar convites e vínculos de assistentes, removendo acessos que deixaram de ser necessários.",
          "Revisar toda minuta e toda análise gerada antes de qualquer uso perante o paciente ou terceiros.",
        ],
      },
      {
        titulo: "6. Serviço de inteligência artificial",
        paragrafos: [
          "A transcrição e a organização de triagens usam provedor de inteligência artificial contratado, sob adendo específico de proteção de dados, sem uso do conteúdo para treinamento de modelos.",
          "A análise é administrativa e exige revisão humana; a plataforma não emite diagnóstico nem conduta clínica.",
        ],
      },
      {
        titulo: "7. Subtratadores",
        paragrafos: [
          "O Operador pode contratar subtratadores de infraestrutura, armazenamento, envio de e-mail e inteligência artificial, mantendo obrigações equivalentes às deste contrato.",
          `Relação de subtratadores em anexo, a confirmar: ${PREENCHER}.`,
        ],
      },
      {
        titulo: "8. Segurança da informação",
        paragrafos: [
          "Comunicação cifrada em trânsito, armazenamento em ambiente com controle de acesso por conta, arquivos de áudio em repositório privado e credenciais administrativas restritas ao servidor.",
          "Controles de acesso revistos periodicamente e registro de auditoria preservado.",
        ],
      },
      {
        titulo: "9. Incidentes",
        paragrafos: [
          "Comunicação ao Controlador sem demora injustificada após a confirmação de incidente relevante, com natureza dos dados, titulares envolvidos, medidas de contenção e correção.",
          "O Controlador decide sobre a comunicação aos titulares e à autoridade nacional.",
        ],
      },
      {
        titulo: "10. Retenção e eliminação",
        paragrafos: [
          "Não há expiração automática de registros; a eliminação é feita pelo Controlador na ficha do paciente e é registrada como pedido do titular.",
          "Após a exclusão, cópias de segurança da infraestrutura podem conter o registro até expirarem dentro da janela de retenção do provedor de hospedagem.",
          "Encerrado o contrato, o Controlador pode exportar os dados antes da eliminação definitiva.",
        ],
      },
      {
        titulo: "11. Vigência e foro",
        paragrafos: [
          "Este contrato vigora enquanto a conta estiver ativa na plataforma.",
          `Foro eleito: ${PREENCHER}.`,
          `Encarregado de proteção de dados do Controlador: ${PREENCHER}. Encarregado do Operador: ${PREENCHER}.`,
        ],
      },
    ],
  };
}

export function docPorSlug(
  slug: ConformidadeDoc["slug"],
  clinica: Clinica | null | undefined,
): ConformidadeDoc {
  return slug === "retencao" ? docRetencao(clinica) : docContratoLgpd(clinica);
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Documento em HTML que Word e Google Docs abrem como texto editável. */
export function docParaHtml(doc: ConformidadeDoc): string {
  const corpo = doc.blocos
    .map(
      (b) =>
        `<h2 style="font-size:13pt;margin:18pt 0 6pt;">${escapar(b.titulo)}</h2>` +
        b.paragrafos
          .map((p) => `<p style="margin:0 0 8pt;line-height:1.5;">${escapar(p)}</p>`)
          .join(""),
    )
    .join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(doc.titulo)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;">
<p style="font-size:9pt;letter-spacing:2px;margin:0 0 4pt;">LEGAL HEALTH · INTELIGÊNCIA JURÍDICA PARA SAÚDE</p>
<h1 style="font-size:16pt;margin:0 0 4pt;">${escapar(doc.titulo)}</h1>
<p style="font-size:9pt;color:#555;margin:0 0 4pt;">${escapar(CONFORMIDADE_VERSAO)}</p>
<p style="font-size:9pt;color:#555;margin:0 0 16pt;">${escapar(CONFORMIDADE_AVISO)}</p>
${corpo}
</body></html>`;
}

/** Baixa o documento como arquivo .doc (abre no Word e no Google Docs). */
export function baixarWord(doc: ConformidadeDoc) {
  const blob = new Blob([docParaHtml(doc)], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${doc.arquivo}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
