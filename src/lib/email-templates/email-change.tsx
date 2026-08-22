import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
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
  link,
  main,
  text,
} from './brand'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail é o endereço atual do usuário (HookData.OldEmail). Na metade do
  // fanout enviada ao NOVO endereço, `email` é igual ao destinatário (NOVO),
  // então a linha "de" precisa usar oldEmail para ler "de ANTIGO para NOVO".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail na Legal Health</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>
        <Heading style={h1}>Confirme a alteração de e-mail</Heading>
        <Text style={text}>
          Você solicitou alterar o e-mail da sua conta na {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar alteração
        </Button>
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente alterando a
          senha.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
