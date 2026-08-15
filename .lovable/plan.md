# Legal Health — Layout base e navegação

Aplicação em português do Brasil, estética minimalista premium (referências Linear, Stripe, Apple Health), tema escuro fixo com marca dourada.

## Identidade visual

Tokens definidos no design system (sem cores hardcoded nos componentes):

- Fundo: `#0A0A0A` · Cartões/painéis: `#141414` · Borda: `#242424` · raio `rounded-2xl`
- Dourado da marca: `#C8A96A` (botões principais, destaques, títulos de seção); dourado claro `#EDE3C8` para o wordmark
- Azul `#2563EB` apenas como acento funcional (alertas informativos, balões de chat do usuário)
- Verde `#2FBF7B` (positivo), âmbar `#D9A648` (risco médio), vermelho `#E0655F` (risco alto)
- Texto: `#F5F5F5` principal, `#9CA3AF` secundário, `#6B7280` discreto
- Tipografia: serifada para o wordmark e títulos (Cormorant Garamond), sans limpa para o corpo (Inter/Karla), com bom espaçamento de letras. Sem gradientes chamativos, sem emojis decorativos.

## Estrutura

Header fixo:
- Monograma LH (logo enviado) + wordmark "LEGAL HEALTH" em serifada dourada clara com letras espaçadas, e abaixo a tagline "inteligência jurídica para medicina" em minúsculas espaçadas douradas
- Desktop: navegação horizontal com 6 destinos — Início, IA, Juriscore®, Plano, Biblioteca, Perfil
- Avatar circular à direita, ligado a /perfil

Mobile:
- Barra de navegação fixa na base com ícones + rótulos curtos para os 6 destinos; sem navegação horizontal no header

Rodapé (apenas desktop):
- Marca discreta e slogan "ANTECIPE · DECIDA · PROTEJA"

## Páginas

Seis rotas, cada uma apenas com o título por enquanto:

```text
/            Início
/ia          IA
/juriscore   Juriscore®
/plano       Plano
/biblioteca  Biblioteca
/perfil      Perfil
```

Cada rota recebe metadados próprios (título, descrição, og/twitter) em português.

## Detalhes técnicos

- Tokens de cor em `src/styles.css` (`@theme inline` + `:root`, valores em oklch), incluindo `--brand-gold`, `--gold-light`, `--info`, `--success`, `--warn`, `--danger`
- Fontes carregadas via `<link>` no `src/routes/__root.tsx`
- Chrome compartilhado (header, nav mobile, rodapé) no `__root.tsx` ao redor do `<Outlet />`
- Logos enviados publicados como assets (monograma para o header, ícone como favicon)
- Navegação com `<Link>` do TanStack Router e `activeProps` para estado ativo
- Layout responsivo: linhas do header usando grid + `min-w-0`/`shrink-0`, padding inferior nas páginas para não ficar sob a barra mobile
