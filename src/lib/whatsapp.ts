/**
 * Envio pelo WhatsApp por link pronto (wa.me).
 *
 * O profissional recebe o conteúdo no próprio WhatsApp: o app abre a conversa
 * com a mensagem já escrita e ele só toca em enviar. Não há API, número
 * aprovado nem serviço de disparo envolvido.
 */

/** Deixa o número no formato aceito pelo wa.me (só dígitos, com DDI do Brasil). */
export function normalizarWhatsApp(valor: string): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.startsWith("55")) return digitos.length >= 12 && digitos.length <= 13 ? digitos : null;
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos.length >= 11 && digitos.length <= 15 ? digitos : null;
}

/** Máscara legível para exibir no Perfil. */
export function formatarWhatsApp(valor: string): string {
  const n = normalizarWhatsApp(valor);
  if (!n) return valor;
  const local = n.startsWith("55") ? n.slice(2) : n;
  if (local.length === 11) return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return `+${n}`;
}

const LIMITE_TEXTO = 1200;

export type MensagemWhatsApp = {
  titulo: string;
  /** trecho do documento ou resumo da triagem */
  corpo?: string;
  /** caminho interno do app (ex.: /biblioteca?cat=minutas) */
  caminho?: string;
};

/** Monta o texto da mensagem, com o link do app quando houver. */
export function montarMensagem({ titulo, corpo, caminho }: MensagemWhatsApp): string {
  const partes = [`*${titulo}* — Legal Health`];
  if (corpo?.trim()) {
    const texto = corpo.trim();
    partes.push(texto.length > LIMITE_TEXTO ? `${texto.slice(0, LIMITE_TEXTO)}…` : texto);
  }
  if (caminho && typeof window !== "undefined") {
    partes.push(`Abrir no app: ${new URL(caminho, window.location.origin).toString()}`);
  }
  return partes.join("\n\n");
}

/** Link wa.me pronto; sem número, abre o WhatsApp para o profissional escolher. */
export function montarLinkWhatsApp(numero: string | null | undefined, msg: MensagemWhatsApp) {
  const texto = encodeURIComponent(montarMensagem(msg));
  const n = numero ? normalizarWhatsApp(numero) : null;
  return n ? `https://wa.me/${n}?text=${texto}` : `https://wa.me/?text=${texto}`;
}

/** Abre o WhatsApp (app no celular, WhatsApp Web no computador). */
export function abrirWhatsApp(numero: string | null | undefined, msg: MensagemWhatsApp) {
  const url = montarLinkWhatsApp(numero, msg);
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}
