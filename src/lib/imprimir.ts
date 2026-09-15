/**
 * Impressão de documentos gerados (minutas, protocolos, checklists).
 * Abre uma aba em página branca com o texto formatado e chama a impressão do
 * aparelho, onde o próprio sistema oferece "Salvar como PDF".
 */

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DocumentoImpressao = {
  titulo: string;
  corpo: string;
  /** Aviso de revisão humana exibido no rodapé. */
  aviso?: string;
};

export const AVISO_IMPRESSAO =
  "Documento gerado com apoio de inteligência artificial. Revisão humana obrigatória antes do uso.";

export function documentoParaHtml(doc: DocumentoImpressao): string {
  const paragrafos = doc.corpo
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map(
      (bloco) =>
        `<p style="margin:0 0 10pt;line-height:1.55;white-space:pre-wrap;">${escapar(bloco)}</p>`,
    )
    .join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(
    doc.titulo,
  )}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;background:#fff;margin:32pt;">
<p style="font-size:9pt;letter-spacing:2px;margin:0 0 4pt;">LEGAL HEALTH · INTELIGÊNCIA JURÍDICA PARA SAÚDE</p>
<h1 style="font-size:15pt;margin:0 0 16pt;">${escapar(doc.titulo)}</h1>
${paragrafos}
<p style="margin-top:24pt;font-size:9pt;color:#555;">${escapar(doc.aviso ?? AVISO_IMPRESSAO)}</p>
</body></html>`;
}

/** Retorna false quando o navegador bloqueia a abertura da nova aba. */
export function imprimirDocumento(doc: DocumentoImpressao): boolean {
  const janela = window.open("", "_blank");
  if (!janela) return false;
  janela.document.write(documentoParaHtml(doc));
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 300);
  return true;
}
