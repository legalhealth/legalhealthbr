import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import {
  brandName,
  brandTagline,
  brandWrap,
  button,
  container,
  footer,
  h1,
  main,
  text,
} from './brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso à Legal Health</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Clique no botão abaixo para entrar na {siteName}. O link expira em poucos minutos.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar na plataforma
        </Button>
        <Text style={footer}>
          Se você não solicitou este acesso, ignore este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
