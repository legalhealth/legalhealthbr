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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para acessar a Legal Health</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandWrap}>
          <Text style={brandName}>Legal Health</Text>
          <Text style={brandTagline}>ANTECIPE · DECIDA · PROTEJA</Text>
        </Section>
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Seu cadastro na{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{' '}
          foi criado. Falta apenas confirmar o endereço{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          .
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar e-mail
        </Button>
        <Text style={footer}>
          Se você não criou esta conta, ignore este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
