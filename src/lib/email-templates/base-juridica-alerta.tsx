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
  brandName,
  brandTagline,
  brandWrap,
  container,
  footer,
  h1,
  main,
  text,
} from './brand'

export interface AlertaBaseItem {
  tipo: 'alterada' | 'revogada' | 'falha'
  title: string
  number?: string | null
  issuingBody?: string | null
  version?: number | null
  mensagem: string
  officialUrl?: string | null
}

interface BaseJuridicaAlertaProps {
  executadoEm?: string
  alertas?: AlertaBaseItem[]
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
  lineHeight: '20px',
  color: '#4B5563',
  margin: '0 0 4px',
}

const TITULOS: Record<AlertaBaseItem['tipo'], string> = {
  alterada: 'Norma alterada',
  revogada: 'Norma revogada',
  falha: 'Falha na coleta oficial',
}

export function BaseJuridicaAlerta({
  executadoEm = new Date().toLocaleString('pt-BR'),
  alertas = [],
}: BaseJuridicaAlertaProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Mudanças detectadas na base jurídica da Legal Health</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandWrap}>
            <Text style={brandName}>LEGAL HEALTH</Text>
            <Text style={brandTagline}>Inteligência Jurídica para Saúde</Text>
          </Section>

          <Heading style={h1}>Atualização automática da base jurídica</Heading>

          <Text style={text}>
            A rotina automática conferiu as fontes oficiais em {executadoEm} e encontrou{' '}
            {alertas.length} ponto(s) que exigem atenção da curadoria jurídica.
          </Text>

          <Hr />

          {alertas.map((a, i) => (
            <Section key={i} style={{ margin: '0 0 20px' }}>
              <Text style={label}>{TITULOS[a.tipo]}</Text>
              <Text style={{ ...text, margin: '0 0 6px', fontWeight: 700 }}>
                {a.title}
                {a.number ? ` — ${a.number}` : ''}
              </Text>
              {a.issuingBody ? <Text style={meta}>{a.issuingBody}</Text> : null}
              {a.version ? <Text style={meta}>Versão indexada: {a.version}</Text> : null}
              <Text style={meta}>{a.mensagem}</Text>
              {a.officialUrl ? <Text style={meta}>{a.officialUrl}</Text> : null}
            </Section>
          ))}

          <Hr />
          <Text style={footer}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: BaseJuridicaAlerta,
  subject: (data) =>
    `Base jurídica: ${(data['alertas'] as AlertaBaseItem[] | undefined)?.length ?? 0} alerta(s) de norma alterada ou revogada`,
  displayName: 'Base jurídica — alerta de alteração',
  previewData: {
    executadoEm: '03/09/2026 06:00',
    alertas: [
      {
        tipo: 'alterada',
        title: 'Lei Geral de Proteção de Dados Pessoais',
        number: '13.709/2018',
        issuingBody: 'Congresso Nacional',
        version: 2,
        mensagem: 'Versão 2 publicada com 11 trechos vigentes.',
        officialUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
      },
    ],
  },
}

export default BaseJuridicaAlerta
