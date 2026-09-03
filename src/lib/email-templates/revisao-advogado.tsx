import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import type { TemplateEntry } from './registry'
import {
  GOLD,
  INK,
  brandName,
  brandTagline,
  brandWrap,
  container,
  footer,
  h1,
  link,
  main,
  text,
} from './brand'

interface RevisaoAdvogadoProps {
  advogadoNome?: string
  medicoNome?: string
  medicoEmail?: string
  titulo?: string
  mensagem?: string
  conteudo?: string
  protocolo?: string
  enviadoEm?: string
  anexos?: { nome: string; url: string }[]
  link?: string | null
}

const label = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: GOLD,
  margin: '0 0 6px',
}

const meta = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '13px',
  color: INK,
  margin: '0 0 4px',
}

const pre = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '13px',
  color: '#55575d',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
}

const box = {
  border: '1px solid #F1EADA',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 22px',
}

const RevisaoAdvogadoEmail = ({
  advogadoNome,
  medicoNome,
  medicoEmail,
  titulo,
  mensagem,
  conteudo,
  protocolo,
  enviadoEm,
  anexos = [],
  link: linkRevisao,
}: RevisaoAdvogadoProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Revisão jurídica solicitada: ${titulo ?? 'peça jurídica'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>

        <Heading style={h1}>Solicitação de revisão jurídica</Heading>
        <Text style={text}>
          {advogadoNome ? `Prezado(a) ${advogadoNome},` : 'Prezado(a) advogado(a),'} você recebeu
          uma peça para revisão enviada pela plataforma Legal Health.
        </Text>

        <Section style={box}>
          <Text style={label}>Solicitante</Text>
          <Text style={meta}>{medicoNome ?? 'Profissional Legal Health'}</Text>
          {medicoEmail ? <Text style={meta}>{medicoEmail}</Text> : null}
          <Text style={{ ...label, margin: '14px 0 6px' }}>Peça</Text>
          <Text style={meta}>{titulo ?? 'Peça jurídica'}</Text>
          {protocolo ? (
            <Text style={{ ...meta, color: '#9CA3AF' }}>
              Protocolo {protocolo.slice(0, 8)}
              {enviadoEm ? ` · ${enviadoEm}` : ''}
            </Text>
          ) : null}
        </Section>

        {linkRevisao ? (
          <Section style={box}>
            <Text style={label}>Acesso seguro (sem login)</Text>
            <Text style={{ ...meta, margin: '0 0 8px' }}>
              <Link href={linkRevisao} style={link}>
                Abrir a revisão completa, com a intimação anexada e o Juriscore do paciente
              </Link>
            </Text>
            <Text style={{ ...meta, color: '#9CA3AF' }}>Link válido por 7 dias.</Text>
          </Section>
        ) : null}

        {mensagem ? (
          <Section style={box}>
            <Text style={label}>Mensagem do solicitante</Text>
            <Text style={pre}>{mensagem}</Text>
          </Section>
        ) : null}

        {anexos.length > 0 ? (
          <Section style={box}>
            <Text style={label}>{`Documentos anexos (${anexos.length}) — links válidos por 24h`}</Text>
            {anexos.map((a) => (
              <Text key={a.url} style={{ ...meta, margin: '0 0 8px' }}>
                <Link href={a.url} style={link}>
                  {a.nome}
                </Link>
              </Text>
            ))}
          </Section>
        ) : null}

        {conteudo ? (
          <Section style={box}>
            <Text style={label}>Conteúdo da peça</Text>
            <Text style={pre}>{conteudo}</Text>
          </Section>
        ) : null}

        <Hr style={{ borderColor: '#F1EADA', margin: '0 0 18px' }} />
        <Text style={footer}>
          Conteúdo gerado com apoio de inteligência artificial na plataforma Legal Health —
          sujeito a revisão e validação do advogado responsável.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RevisaoAdvogadoEmail,
  subject: (data: Record<string, any>) =>
    `[Legal Health] Revisão: ${data['titulo'] ?? 'peça jurídica'}`,
  displayName: 'Revisão jurídica (advogado)',
  previewData: {
    advogadoNome: 'Dra. Marina Alves',
    medicoNome: 'Dr. Paulo Menezes',
    medicoEmail: 'paulo@clinica.com.br',
    titulo: 'Defesa administrativa — Reclamação CRM',
    mensagem: 'Prazo de 10 dias. Atenção ao registro de prontuário.',
    conteudo: 'EXCELENTÍSSIMO SENHOR PRESIDENTE...',
    protocolo: '8f2c1a4e-0000-0000-0000-000000000000',
    enviadoEm: '22/08/2026 00:20',
    anexos: [{ nome: 'reclamacao.pdf', url: 'https://exemplo.com/arquivo' }],
    link: 'https://legalhealthbr.app/revisao/abc123',
  },
} satisfies TemplateEntry

export default RevisaoAdvogadoEmail
