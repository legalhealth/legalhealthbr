/** Estilos compartilhados dos e-mails Legal Health (inline, seguros para clientes de e-mail). */

export const GOLD = '#B8975A'
export const INK = '#111111'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: '0',
  padding: '24px 0',
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 32px 28px',
  border: '1px solid #EDE3C8',
  borderRadius: '16px',
}

export const brandWrap = {
  borderBottom: `1px solid #EDE3C8`,
  paddingBottom: '18px',
  marginBottom: '28px',
}

export const brandName = {
  fontSize: '15px',
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  color: GOLD,
  margin: '0',
}

export const brandTagline = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '11px',
  letterSpacing: '0.18em',
  color: '#9CA3AF',
  margin: '6px 0 0',
}

export const h1 = {
  fontSize: '24px',
  fontWeight: 'normal' as const,
  color: INK,
  margin: '0 0 18px',
}

export const text = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.65',
  margin: '0 0 22px',
}

export const link = { color: GOLD, textDecoration: 'underline' }

export const button = {
  backgroundColor: GOLD,
  color: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '14px',
  letterSpacing: '0.04em',
  borderRadius: '10px',
  padding: '13px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  letterSpacing: '0.18em',
  fontWeight: 'bold' as const,
  color: INK,
  margin: '0 0 28px',
}

export const footer = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '12px',
  color: '#9CA3AF',
  lineHeight: '1.6',
  margin: '28px 0 0',
  borderTop: '1px solid #F1EADA',
  paddingTop: '18px',
}
