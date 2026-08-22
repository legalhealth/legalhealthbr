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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha da Legal Health</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>
        <Heading style={h1}>Redefinir senha</Heading>
        <Text style={text}>
          Recebemos um pedido para redefinir a senha da sua conta na {siteName}. Clique no
          botão abaixo para criar uma nova senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Criar nova senha
        </Button>
        <Text style={footer}>
          Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a
          mesma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
