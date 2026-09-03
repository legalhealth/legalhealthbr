# Landing page pública antes do cadastro

Hoje `/` já é a área logada: quem não tem sessão é redirecionado direto para `/auth`. A proposta é abrir uma landing page pública em `/` que apresente o serviço, e mover o painel logado para `/inicio`.

## O que a landing terá

- Cabeçalho público enxuto: marca LEGAL HEALTH + tagline, botões "Entrar" e "Criar conta" (levam a `/auth`).
- Hero: proposta de valor ("Inteligência jurídica para medicina"), subtítulo, CTA principal dourado e CTA secundário "Ver como funciona".
- Módulos do produto em cartões: Juriscore®, Assistente de IA com base jurídica própria, Plano de Ação, Redigir peça a partir do documento, Biblioteca, Envio ao advogado.
- Seção "Como funciona" em 3 passos: diagnóstico → plano → execução com IA.
- Diferencial de confiança: respostas com norma, artigo, órgão e link oficial (leis do Planalto e resoluções do CFM já indexadas), base atualizada automaticamente.
- Planos (Essential, Professional, Enterprise) com os preços já usados no Perfil, cada um com CTA para cadastro.
- FAQ curta + aviso legal (a plataforma não substitui advogado).
- Rodapé com marca e "ANTECIPE · DECIDA · PROTEJA".

Estética mantida: fundo #0A0A0A, cartões #141414/borda #242424, dourado #C8A96A, Playfair/serifada nos títulos, glassmorphism discreto, sem gradientes chamativos.

## Navegação

- Visitante em `/` → landing (sem redirecionar para login).
- Usuário logado que abrir `/` → redirecionado para `/inicio`.
- Após login/cadastro, destino continua sendo a área logada (`/inicio`).
- Marca no header logado e todos os links internos passam a apontar para `/inicio`.

## Detalhes técnicos

- Criar `src/routes/index.tsx` (público) com `head()` próprio: title, description, og:title, og:description, og:type, twitter:card.
- Renomear `src/routes/_authenticated/index.tsx` para `_authenticated/inicio.tsx` (`createFileRoute("/_authenticated/inicio")`), evitando conflito de duas rotas em `/`.
- Atualizar `nav-items.ts`, `site-header.tsx`, `mobile-nav.tsx`, `__root.tsx` e qualquer `to="/"` interno para `/inicio`; ajustar o `redirect` pós-login em `auth.tsx`.
- O widget de chatbot público continua disponível na landing (já suporta visitantes).
- A landing é estática: pode entrar em `pages` com prerender para carregar rápido e ser indexável.
