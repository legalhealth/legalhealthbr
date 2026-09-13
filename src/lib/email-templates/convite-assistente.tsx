import * as React from 'react'

import {
  Body,
  Button,
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

interface ConviteAssistenteProps {
  medicoNome?: string
  assistenteNome?: string
  link?: string
  validade?: string
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

const cta = {
  backgroundColor: INK,
  color: '#F7EFDD',
  borderRadius: '10px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '14px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}

const ConviteAssistenteEmail = ({
  medicoNome,
  assistenteNome,
  link,
  validade,
}: ConviteAssistenteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`${medicoNome ?? 'Sua clínica'} convidou você para a Legal Health`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>

        <Heading style={h1}>Convite para a área de pacientes</Heading>
        <Text style={text}>
          {assistenteNome ? `${assistenteNome},` : 'Olá,'}{' '}
          <strong>{medicoNome ?? 'a clínica'}</strong> convidou você para acessar a área de
          pacientes da Legal Health como assistente da clínica.
        </Text>

        <Section style={box}>
          <Text style={label}>O que você poderá fazer</Text>
          <Text style={meta}>Ver as fichas dos pacientes e o histórico de atendimentos</Text>
          <Text style={meta}>Cadastrar pacientes e registrar triagens</Text>
          <Text style={{ ...label, margin: '14px 0 6px' }}>O que fica fora do acesso</Text>
          <Text style={meta}>Assinatura, configurações e dados financeiros do médico</Text>
          <Text style={meta}>Excluir fichas ou registros</Text>
        </Section>

        {link ? (
          <Section style={{ margin: '0 0 22px' }}>
            <Button href={link} style={cta}>
              Aceitar o convite
            </Button>
          </Section>
        ) : null}

        <Text style={text}>
          O convite vale por {validade ?? '7 dias'}. Você precisa de uma conta Legal Health com este
          mesmo e-mail — se ainda não tiver, o link abre o cadastro.
        </Text>

        <Hr style={{ borderColor: '#F1EADA', margin: '0 0 18px' }} />
        <Text style={footer}>
          Se você não esperava este convite, ignore esta mensagem — nenhum acesso é criado sem sua
          confirmação.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConviteAssistenteEmail,
  subject: (data: Record<string, any>) =>
    `${data['medicoNome'] ?? 'Uma clínica'} convidou você para a Legal Health`,
  displayName: 'Convite de assistente da clínica',
  previewData: {
    medicoNome: 'Dr. Paulo Menezes',
    assistenteNome: 'Carla',
    link: 'https://legalhealthbr.app/convite/exemplo',
    validade: '7 dias',
  },
} satisfies TemplateEntry

export default ConviteAssistenteEmail
