import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
  main,
  text,
} from './brand'

interface RevisaoParecerProps {
  medicoNome?: string
  advogadoNome?: string
  advogadoOab?: string
  titulo?: string
  statusLabel?: string
  parecer?: string
  protocolo?: string
  registradoEm?: string
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

const RevisaoParecerEmail = ({
  medicoNome,
  advogadoNome,
  advogadoOab,
  titulo,
  statusLabel,
  parecer,
  protocolo,
  registradoEm,
}: RevisaoParecerProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Parecer do advogado: ${titulo ?? 'peça jurídica'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>

        <Heading style={h1}>Parecer do advogado registrado</Heading>
        <Text style={text}>
          {medicoNome ? `Prezado(a) ${medicoNome},` : 'Prezado(a) profissional,'} o advogado
          responsável registrou o parecer da revisão solicitada por você na plataforma Legal Health.
        </Text>

        <Section style={box}>
          <Text style={label}>Advogado</Text>
          <Text style={meta}>
            {advogadoNome ?? 'Advogado responsável'}
            {advogadoOab ? ` — ${advogadoOab}` : ''}
          </Text>
          <Text style={{ ...label, margin: '14px 0 6px' }}>Peça</Text>
          <Text style={meta}>{titulo ?? 'Peça jurídica'}</Text>
          <Text style={{ ...label, margin: '14px 0 6px' }}>Situação</Text>
          <Text style={meta}>{statusLabel ?? 'Em revisão'}</Text>
          {protocolo ? (
            <Text style={{ ...meta, color: '#9CA3AF' }}>
              Protocolo {protocolo.slice(0, 8)}
              {registradoEm ? ` · ${registradoEm}` : ''}
            </Text>
          ) : null}
        </Section>

        {parecer ? (
          <Section style={box}>
            <Text style={label}>Parecer</Text>
            <Text style={pre}>{parecer}</Text>
          </Section>
        ) : null}

        <Hr style={{ borderColor: '#F1EADA', margin: '0 0 18px' }} />
        <Text style={footer}>
          Acompanhe a revisão em Revisões, dentro da área de IA da plataforma Legal Health.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RevisaoParecerEmail,
  subject: (data: Record<string, any>) =>
    `[Legal Health] Parecer do advogado: ${data['titulo'] ?? 'peça jurídica'}`,
  displayName: 'Parecer do advogado (médico)',
  previewData: {
    medicoNome: 'Dr. Paulo Menezes',
    advogadoNome: 'Dra. Marina Alves',
    advogadoOab: 'OAB/CE 12345',
    titulo: 'Defesa administrativa — Reclamação CRM',
    statusLabel: 'Aprovada pelo advogado',
    parecer: 'Peça revisada. Ajustei a fundamentação e incluí o pedido de produção de prova.',
    protocolo: '8f2c1a4e-0000-0000-0000-000000000000',
    registradoEm: '03/09/2026 09:12',
  },
} satisfies TemplateEntry
