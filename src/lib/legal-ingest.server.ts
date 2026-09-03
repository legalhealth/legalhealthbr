import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Pipeline de ingestão da base jurídica.
 *
 * Coleta o texto de leis, resoluções e atos oficiais direto da fonte pública,
 * compara com a versão já indexada (hash de conteúdo) e, quando há mudança,
 * cria uma NOVA versão preservando a anterior — nunca sobrescreve.
 */

export type NivelRisco = "baixo" | "medio" | "alto";
export type SourceType = "constituicao" | "lei" | "decreto" | "resolucao" | "parecer" | "decisao" | "guia" | "doutrina";

export type FonteCatalogo = {
  sourceId: string;
  title: string;
  number: string | null;
  issuingBody: string;
  sourceType: SourceType;
  authorityLevel: 1 | 2 | 3 | 4 | 5;
  officialUrl: string;
  /** HTML oficial coletável automaticamente; PDF exige texto colado pelo curador. */
  formato: "html" | "pdf";
  temas: string[];
  pilar: string | null;
  publicationDate: string;
  effectiveFrom: string;
  nivelRisco: NivelRisco;
  exigeAdvogado: boolean;
  /** Artigos indexados (recorte curado). Vazio = indexa todos os artigos encontrados. */
  artigos: string[];
  termosMedicos: string[];
  termosJuridicos: string[];
  contextoAplicacao: string;
};

/** Recorte inicial controlado: temas que alimentam Juriscore, IA e Plano de Ação. */
export const CATALOGO: FonteCatalogo[] = [
  {
    sourceId: "br-lei-13709-2018",
    title: "Lei Geral de Proteção de Dados Pessoais",
    number: "13.709/2018",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
    formato: "html",
    temas: ["LGPD", "dados sensiveis", "privacidade"],
    pilar: "Documental",
    publicationDate: "2018-08-14",
    effectiveFrom: "2018-08-14",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: ["Art. 5", "Art. 6", "Art. 7", "Art. 11", "Art. 13", "Art. 18", "Art. 37", "Art. 41", "Art. 46", "Art. 48", "Art. 52"],
    termosMedicos: ["dados de saúde", "paciente", "prontuário", "clínica"],
    termosJuridicos: ["base legal", "consentimento", "controlador", "operador", "incidente de segurança"],
    contextoAplicacao: "Tratamento de dados pessoais e de saúde por clínicas e consultórios.",
  },
  {
    sourceId: "br-lei-8078-1990",
    title: "Código de Defesa do Consumidor",
    number: "8.078/1990",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    formato: "html",
    temas: ["consumidor", "responsabilidade civil"],
    pilar: "Histórico",
    publicationDate: "1990-09-11",
    effectiveFrom: "1990-09-11",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: ["Art. 6", "Art. 14", "Art. 20", "Art. 26", "Art. 27", "Art. 39"],
    termosMedicos: ["serviço médico", "paciente"],
    termosJuridicos: ["vício do serviço", "prescrição", "decadência", "inversão do ônus da prova"],
    contextoAplicacao: "Relação de consumo entre paciente e clínica ou consultório.",
  },
  {
    sourceId: "br-lei-10406-2002",
    title: "Código Civil",
    number: "10.406/2002",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    formato: "html",
    temas: ["responsabilidade civil", "contratos", "prescrição"],
    pilar: "Histórico",
    publicationDate: "2002-01-10",
    effectiveFrom: "2003-01-11",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: ["Art. 186", "Art. 187", "Art. 189", "Art. 206", "Art. 421", "Art. 927", "Art. 944", "Art. 951"],
    termosMedicos: ["erro médico", "dano ao paciente"],
    termosJuridicos: ["ato ilícito", "culpa", "prescrição", "indenização", "obrigação de meio"],
    contextoAplicacao: "Responsabilidade civil do médico e prazos prescricionais.",
  },
  {
    sourceId: "br-lei-13105-2015",
    title: "Código de Processo Civil",
    number: "13.105/2015",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
    formato: "html",
    temas: ["prazos", "intimacoes", "processo"],
    pilar: "Operacional",
    publicationDate: "2015-03-16",
    effectiveFrom: "2016-03-18",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: ["Art. 218", "Art. 219", "Art. 224", "Art. 231", "Art. 335", "Art. 373", "Art. 380", "Art. 464"],
    termosMedicos: ["perícia médica", "intimação da clínica"],
    termosJuridicos: ["prazo processual", "dias úteis", "citação", "contestação", "ônus da prova"],
    contextoAplicacao: "Contagem de prazos e deveres processuais após intimação recebida pelo médico.",
  },
  {
    sourceId: "br-cf-1988",
    title: "Constituição da República Federativa do Brasil",
    number: "1988",
    issuingBody: "Congresso Nacional",
    sourceType: "constituicao",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    formato: "html",
    temas: ["direitos fundamentais", "privacidade", "saúde"],
    pilar: "Regulatório",
    publicationDate: "1988-10-05",
    effectiveFrom: "1988-10-05",
    nivelRisco: "medio",
    exigeAdvogado: false,
    artigos: ["Art. 5", "Art. 196", "Art. 197", "Art. 199"],
    termosMedicos: ["saúde", "atendimento"],
    termosJuridicos: ["intimidade", "vida privada", "sigilo", "dever do Estado"],
    contextoAplicacao: "Fundamento constitucional do sigilo, da privacidade e do direito à saúde.",
  },
  {
    sourceId: "br-lei-12842-2013",
    title: "Lei do Ato Médico",
    number: "12.842/2013",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12842.htm",
    formato: "html",
    temas: ["exercício profissional", "atos médicos"],
    pilar: "Regulatório",
    publicationDate: "2013-07-10",
    effectiveFrom: "2013-07-10",
    nivelRisco: "medio",
    exigeAdvogado: false,
    artigos: ["Art. 2", "Art. 4", "Art. 5"],
    termosMedicos: ["diagnóstico", "procedimento invasivo", "prescrição"],
    termosJuridicos: ["atividade privativa", "exercício profissional"],
    contextoAplicacao: "Delimitação dos atos privativos do médico na clínica.",
  },
  {
    sourceId: "br-lei-13787-2018",
    title: "Digitalização e guarda de prontuários de pacientes",
    number: "13.787/2018",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm",
    formato: "html",
    temas: ["prontuario", "guarda documental", "digitalização"],
    pilar: "Documental",
    publicationDate: "2018-12-27",
    effectiveFrom: "2019-03-27",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: ["Art. 1", "Art. 2", "Art. 3", "Art. 4", "Art. 6", "Art. 7", "Art. 8"],
    termosMedicos: ["prontuário", "paciente", "arquivo clínico"],
    termosJuridicos: ["guarda", "descarte", "certificação digital", "prazo mínimo"],
    contextoAplicacao: "Prazo e requisitos de guarda e eliminação de prontuários digitalizados.",
  },
  {
    sourceId: "br-lei-14510-2022",
    title: "Telessaúde no Sistema Único de Saúde e na iniciativa privada",
    number: "14.510/2022",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14510.htm",
    formato: "html",
    temas: ["telemedicina", "telessaúde"],
    pilar: "Operacional",
    publicationDate: "2022-12-27",
    effectiveFrom: "2022-12-28",
    nivelRisco: "medio",
    exigeAdvogado: false,
    artigos: ["Art. 1", "Art. 2", "Art. 3", "Art. 26-A", "Art. 26-B"],
    termosMedicos: ["teleconsulta", "atendimento remoto", "paciente"],
    termosJuridicos: ["consentimento", "registro profissional", "sigilo"],
    contextoAplicacao: "Requisitos legais do atendimento médico a distância.",
  },
  {
    sourceId: "br-lei-9656-1998",
    title: "Planos e seguros privados de assistência à saúde",
    number: "9.656/1998",
    issuingBody: "Congresso Nacional",
    sourceType: "lei",
    authorityLevel: 1,
    officialUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9656compilado.htm",
    formato: "html",
    temas: ["planos de saúde", "glosas", "ANS"],
    pilar: "Operacional",
    publicationDate: "1998-06-03",
    effectiveFrom: "1998-09-02",
    nivelRisco: "medio",
    exigeAdvogado: true,
    artigos: ["Art. 1", "Art. 10", "Art. 12", "Art. 13", "Art. 18", "Art. 35-C"],
    termosMedicos: ["procedimento", "cobertura", "urgência"],
    termosJuridicos: ["contrato de plano", "carência", "reembolso", "credenciamento"],
    contextoAplicacao: "Relação entre clínica, operadora e paciente beneficiário.",
  },
  {
    sourceId: "cfm-res-2314-2022",
    title: "Telemedicina",
    number: "2.314/2022",
    issuingBody: "Conselho Federal de Medicina",
    sourceType: "resolucao",
    authorityLevel: 2,
    officialUrl: "https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2022/2314",
    formato: "pdf",
    temas: ["telemedicina"],
    pilar: "Operacional",
    publicationDate: "2022-05-05",
    effectiveFrom: "2022-05-05",
    nivelRisco: "medio",
    exigeAdvogado: false,
    artigos: [],
    termosMedicos: ["teleconsulta", "telemonitoramento"],
    termosJuridicos: ["consentimento", "registro"],
    contextoAplicacao: "Regras do CFM para telemedicina.",
  },
  {
    sourceId: "cfm-res-2336-2023",
    title: "Publicidade e propaganda médicas",
    number: "2.336/2023",
    issuingBody: "Conselho Federal de Medicina",
    sourceType: "resolucao",
    authorityLevel: 2,
    officialUrl: "https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2023/2336",
    formato: "pdf",
    temas: ["publicidade medica"],
    pilar: "Regulatório",
    publicationDate: "2023-09-13",
    effectiveFrom: "2023-09-13",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: [],
    termosMedicos: ["antes e depois", "divulgação de procedimento"],
    termosJuridicos: ["publicidade", "sensacionalismo", "autopromoção"],
    contextoAplicacao: "Divulgação da atividade médica em redes sociais e mídia.",
  },
  {
    sourceId: "cfm-res-2217-2018",
    title: "Código de Ética Médica",
    number: "2.217/2018",
    issuingBody: "Conselho Federal de Medicina",
    sourceType: "resolucao",
    authorityLevel: 2,
    officialUrl: "https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2018/2217",
    formato: "pdf",
    temas: ["etica medica", "consentimento", "sigilo"],
    pilar: "Regulatório",
    publicationDate: "2018-11-01",
    effectiveFrom: "2019-04-30",
    nivelRisco: "alto",
    exigeAdvogado: true,
    artigos: [],
    termosMedicos: ["prontuário", "paciente", "sigilo"],
    termosJuridicos: ["vedação ética", "infração ética"],
    contextoAplicacao: "Deveres éticos aplicáveis à rotina do consultório.",
  },
];

export type ResultadoIngestao = {
  sourceId: string;
  title: string;
  resultado: "nova_versao" | "sem_mudanca" | "manual" | "erro";
  version: number | null;
  chunks: number;
  tamanhoTexto: number;
  mensagem: string;
};

/** Texto legível a partir do HTML oficial (sem dependências externas). */
export function htmlParaTexto(html: string): string {
  let t = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  t = t.replace(/<br[^>]*>|<\/p>|<\/div>|<\/tr>|<\/h[1-6]>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&ordf;/gi, "ª")
    .replace(/&ordm;/gi, "º")
    .replace(/&sect;/gi, "§");
  t = t.replace(/[ \t\u00a0]+/g, " ");
  t = t.replace(/\n\s*\n+/g, "\n");
  return t.trim();
}

const ARTIGO_RE = /(?:^|\n)\s*(Art\.\s?\d+(?:[ºo°]|-[A-Z])?)/g;

export type TrechoColetado = { artigo: string; texto: string };

/** Divide o texto oficial em artigos, descartando revogados e trechos vazios. */
export function dividirEmArtigos(texto: string, filtro: string[] = []): TrechoColetado[] {
  const marcas: { label: string; index: number; end: number }[] = [];
  ARTIGO_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ARTIGO_RE.exec(texto))) {
    const label = m[1]!.replace(/\s+/g, " ").trim();
    marcas.push({ label, index: m.index, end: m.index + m[0].length });
  }

  const numeroDe = (label: string) =>
    label.replace(/^Art\.\s?/, "").replace(/[ºo°]/g, "").trim().toUpperCase();
  const filtroNormalizado = filtro.map((f) => numeroDe(f));

  const vistos = new Set<string>();
  const trechos: TrechoColetado[] = [];

  for (let i = 0; i < marcas.length; i += 1) {
    const atual = marcas[i]!;
    const proximo = marcas[i + 1];
    const corpo = texto
      .slice(atual.end, proximo ? proximo.index : texto.length)
      .replace(/^[.\-–—:\s]+/, "")
      .trim();
    const numero = numeroDe(atual.label);

    if (filtroNormalizado.length > 0 && !filtroNormalizado.includes(numero)) continue;
    if (vistos.has(numero)) continue; // texto compilado repete o artigo em notas
    if (corpo.length < 40) continue;
    if (/^\(?revogad/i.test(corpo)) continue;

    vistos.add(numero);
    trechos.push({
      artigo: atual.label,
      texto: corpo.length > 4000 ? `${corpo.slice(0, 4000)}…` : corpo,
    });
  }

  return trechos;
}

async function sha256(texto: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Baixa o HTML oficial respeitando a codificação declarada pela fonte. */
async function baixarTexto(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "LegalHealthBot/1.0 (+https://legalhealthbr.app)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`A fonte respondeu ${res.status}.`);

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "";
  const charset = /charset=([\w-]+)/i.exec(contentType)?.[1]?.toLowerCase();

  const decodificar = (encoding: string) => new TextDecoder(encoding).decode(buffer);
  let bruto = decodificar(charset && charset !== "utf-8" ? charset : "utf-8");
  // Planalto serve boa parte das leis em latin-1 sem declarar corretamente.
  if (!charset && bruto.includes("\uFFFD")) bruto = decodificar("windows-1252");

  return htmlParaTexto(bruto);
}

/**
 * Coleta e indexa uma fonte do catálogo.
 * Sem mudança de conteúdo: só atualiza a data de conferência.
 * Com mudança: cria nova versão, aponta a anterior como substituída e reindexa.
 */
export async function ingerirFonte(
  fonte: FonteCatalogo,
  executadoPor: string | null,
): Promise<ResultadoIngestao> {
  const base: ResultadoIngestao = {
    sourceId: fonte.sourceId,
    title: fonte.title,
    resultado: "erro",
    version: null,
    chunks: 0,
    tamanhoTexto: 0,
    mensagem: "",
  };

  const registrar = async (r: ResultadoIngestao) => {
    await supabaseAdmin.from("legal_ingest_runs").insert({
      source_id: r.sourceId,
      official_url: fonte.officialUrl,
      resultado: r.resultado,
      version: r.version,
      chunks: r.chunks,
      tamanho_texto: r.tamanhoTexto,
      mensagem: r.mensagem.slice(0, 500),
      executado_por: executadoPor,
    });
    return r;
  };

  if (fonte.formato === "pdf") {
    return registrar({
      ...base,
      resultado: "manual",
      mensagem:
        "A fonte é publicada em PDF pelo órgão emissor: o texto precisa ser conferido e colado pelo curador jurídico antes de indexar.",
    });
  }

  let texto: string;
  try {
    texto = await baixarTexto(fonte.officialUrl);
  } catch (e) {
    return registrar({ ...base, mensagem: e instanceof Error ? e.message : "Falha ao baixar." });
  }
  if (texto.length < 500) {
    return registrar({ ...base, mensagem: "Conteúdo insuficiente na página oficial." });
  }

  const trechos = dividirEmArtigos(texto, fonte.artigos);
  if (trechos.length === 0) {
    return registrar({
      ...base,
      tamanhoTexto: texto.length,
      mensagem: "Nenhum artigo do recorte curado foi localizado no texto oficial.",
    });
  }

  const conteudo = trechos.map((t) => `${t.artigo} ${t.texto}`).join("\n\n");
  const hash = await sha256(conteudo);

  // Fonte cadastrada (cria ou atualiza os metadados do catálogo).
  const { data: fonteExistente } = await supabaseAdmin
    .from("legal_sources")
    .select("id, current_version_id")
    .eq("source_id", fonte.sourceId)
    .maybeSingle();

  const metadados = {
    source_id: fonte.sourceId,
    source_type: fonte.sourceType,
    issuing_body: fonte.issuingBody,
    title: fonte.title,
    number: fonte.number,
    official_url: fonte.officialUrl,
    jurisdiction: "BR",
    authority_level: fonte.authorityLevel,
    temas: fonte.temas,
    pilar: fonte.pilar,
    publication_date: fonte.publicationDate,
    last_checked_at: new Date().toISOString(),
  };

  let sourceUuid = fonteExistente?.id ?? null;
  if (!sourceUuid) {
    const { data: criada, error } = await supabaseAdmin
      .from("legal_sources")
      .insert({ ...metadados, status: "vigente" })
      .select("id")
      .single();
    if (error || !criada) {
      return registrar({ ...base, mensagem: `Falha ao cadastrar a fonte: ${error?.message}` });
    }
    sourceUuid = criada.id;
  } else {
    await supabaseAdmin.from("legal_sources").update(metadados).eq("id", sourceUuid);
  }

  // Versão vigente já indexada — hash igual significa texto oficial inalterado.
  const { data: versaoAtual } = await supabaseAdmin
    .from("legal_source_versions")
    .select("id, version, content_hash")
    .eq("source_uuid", sourceUuid)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versaoAtual?.content_hash && versaoAtual.content_hash === hash) {
    return registrar({
      ...base,
      resultado: "sem_mudanca",
      version: versaoAtual.version,
      chunks: trechos.length,
      tamanhoTexto: conteudo.length,
      mensagem: "Texto oficial idêntico ao já indexado; data de conferência atualizada.",
    });
  }

  const novaVersao = (versaoAtual?.version ?? 0) + 1;
  const { data: versao, error: versaoError } = await supabaseAdmin
    .from("legal_source_versions")
    .insert({
      source_uuid: sourceUuid,
      version: novaVersao,
      status: "vigente",
      effective_from: fonte.effectiveFrom,
      content: conteudo.slice(0, 500000),
      content_hash: hash,
      supersedes_version_id: versaoAtual?.id ?? null,
      change_reason:
        novaVersao === 1
          ? "Coleta inicial do texto oficial."
          : "Coleta automática detectou alteração no texto oficial.",
      review_notes: `Coletado de ${fonte.officialUrl} em ${new Date().toISOString().slice(0, 10)}.`,
      published: true,
    })
    .select("id, version")
    .single();

  if (versaoError || !versao) {
    return registrar({ ...base, mensagem: `Falha ao criar versão: ${versaoError?.message}` });
  }

  // A versão anterior deixa de ser vigente, mas continua preservada no histórico.
  if (versaoAtual?.id) {
    await supabaseAdmin
      .from("legal_source_versions")
      .update({ status: "alterada", effective_until: new Date().toISOString().slice(0, 10) })
      .eq("id", versaoAtual.id);
  }

  const linhas = trechos.map((t, i) => ({
    version_id: versao.id,
    source_uuid: sourceUuid!,
    ordem: i + 1,
    artigo: t.artigo,
    texto: t.texto,
    temas: fonte.temas,
    pilar: fonte.pilar,
    contexto_aplicacao: fonte.contextoAplicacao,
    nivel_risco: fonte.nivelRisco,
    exige_advogado: fonte.exigeAdvogado,
    termos_medicos: fonte.termosMedicos,
    termos_juridicos: fonte.termosJuridicos,
  }));

  const { error: chunkError } = await supabaseAdmin.from("legal_chunks").insert(linhas);
  if (chunkError) {
    return registrar({
      ...base,
      version: versao.version,
      mensagem: `Falha ao indexar trechos: ${chunkError.message}`,
    });
  }

  await supabaseAdmin
    .from("legal_sources")
    .update({ current_version_id: versao.id, status: "vigente" })
    .eq("id", sourceUuid);

  return registrar({
    ...base,
    resultado: "nova_versao",
    version: versao.version,
    chunks: linhas.length,
    tamanhoTexto: conteudo.length,
    mensagem: `Versão ${versao.version} publicada com ${linhas.length} trechos vigentes.`,
  });
}

/** Executa a coleta de todo o catálogo, uma fonte por vez (sem sobrecarregar os portais). */
export async function ingerirCatalogo(
  executadoPor: string | null,
  apenas: string[] = [],
): Promise<ResultadoIngestao[]> {
  const alvo = apenas.length > 0 ? CATALOGO.filter((f) => apenas.includes(f.sourceId)) : CATALOGO;
  const resultados: ResultadoIngestao[] = [];
  for (const fonte of alvo) {
    resultados.push(await ingerirFonte(fonte, executadoPor));
  }
  return resultados;
}
