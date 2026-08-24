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

interface RevisaoFalhaProps {
  medicoNome?: string
  advogadoNome?: string
  advogadoEmail?: string
  titulo?: string
  protocolo?: string
  tentativaEm?: string
  motivo?: string
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

const box = {
  border: '1px solid #F1EADA',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 22px',
}

const alertBox = {
  border: '1px solid #F3D3D0',
  backgroundColor: '#FDF6F5',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 22px',
}

const RevisaoFalhaEmail = ({
  medicoNome,
  advogadoNome,
  advogadoEmail,
  titulo,
  protocolo,
  tentativaEm,
  motivo,
}: RevisaoFalhaProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Falha no envio da revisão: ${titulo ?? 'peça jurídica'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>

        <Heading style={h1}>Não conseguimos entregar sua revisão</Heading>
        <Text style={text}>
          {medicoNome ? `${medicoNome},` : 'Olá,'} a solicitação de revisão foi registrada na sua
          conta, mas o e-mail para o advogado responsável não foi aceito para entrega. Nenhuma
          informação foi perdida — você pode reenviar pela plataforma.
        </Text>

        <Section style={alertBox}>
          <Text style={label}>Motivo</Text>
          <Text style={{ ...meta, margin: '0' }}>
            {motivo ?? 'O provedor de e-mail não confirmou a entrega.'}
          </Text>
        </Section>

        <Section style={box}>
          <Text style={label}>Destinatário</Text>
          <Text style={meta}>{advogadoNome ?? 'Advogado(a) responsável'}</Text>
          {advogadoEmail ? <Text style={meta}>{advogadoEmail}</Text> : null}
          <Text style={{ ...label, margin: '14px 0 6px' }}>Peça</Text>
          <Text style={meta}>{titulo ?? 'Peça jurídica'}</Text>
          {protocolo ? (
            <Text style={{ ...meta, color: '#9CA3AF' }}>
              Protocolo {protocolo.slice(0, 8)}
              {tentativaEm ? ` · tentativa em ${tentativaEm}` : ''}
            </Text>
          ) : null}
        </Section>

        <Text style={text}>
          Confira o endereço do advogado em Revisões e use “Tentar novamente”. Se o endereço estiver
          correto e a falha persistir, envie o comprovante gerado na plataforma por outro canal.
        </Text>

        <Hr style={{ borderColor: '#F1EADA', margin: '0 0 18px' }} />
        <Text style={footer}>
          Aviso automático da plataforma Legal Health sobre uma tentativa de envio da sua conta.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RevisaoFalhaEmail,
  subject: (data: Record<string, any>) =>
    `[Legal Health] Falha no envio da revisão: ${data['titulo'] ?? 'peça jurídica'}`,
  displayName: 'Falha no envio da revisão (médico)',
  previewData: {
    medicoNome: 'Dr. Paulo Menezes',
    advogadoNome: 'Dra. Marina Alves',
    advogadoEmail: 'marina@advocacia.com.br',
    titulo: 'Defesa administrativa — Reclamação CRM',
    protocolo: '8f2c1a4e-0000-0000-0000-000000000000',
    tentativaEm: '22/08/2026 00:20',
    motivo: 'O endereço do advogado está bloqueado por histórico de falha de entrega.',
  },
} satisfies TemplateEntry

export default RevisaoFalhaEmail
