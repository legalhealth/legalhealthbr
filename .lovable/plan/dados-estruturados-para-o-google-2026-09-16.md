# Dados estruturados para o Google

Hoje o site não envia nenhum dado estruturado. Vou adicionar essas informações
invisíveis ao visitante, que o Google usa para entender melhor quem você é e o
que a plataforma faz.

## O que será adicionado

1. **Identidade da empresa (em todas as páginas)**
   Nome "Legal Health", site oficial `https://legalhealthbr.app`, logomarca,
   descrição curta, idioma português do Brasil e o e-mail de contato como canal
   de atendimento.

2. **Página inicial**
   Descrição da plataforma como aplicativo de inteligência jurídica para
   profissionais e clínicas de saúde no Brasil, com público-alvo, idioma e
   endereço da página.

3. **Programa de Embaixadores**
   Descrição da página como conteúdo informativo do programa, com trilha de
   navegação ("Início › Embaixadores") para o Google mostrar o caminho nos
   resultados.

4. **Páginas legais** (Termos, Privacidade, Retenção de Dados, Canal de
   Privacidade)
   Cada uma identificada como documento institucional, com título, descrição e
   trilha de navegação própria.

Também vou incluir o endereço próprio de cada página (canonical) onde ainda
falta, para o Google não confundir páginas parecidas.

Não vou incluir perguntas frequentes nos dados estruturados: o Google deixou de
exibir esse formato nos resultados. E só declaro informações que já estão no
site — nada inventado (sem CNPJ, telefone, endereço físico ou avaliações).

## Detalhes técnicos

- JSON-LD via `head().scripts` em cada rota, seguindo o padrão do TanStack Start.
- `__root.tsx`: `Organization` + `WebSite` (`url`, `name`, `logo`, `inLanguage: pt-BR`,
  `contactPoint` com `contato@legalhealthbr.app`), sem `og:image` e sem canonical.
- `src/routes/index.tsx`: `SoftwareApplication` (`applicationCategory:
  BusinessApplication`, `audience`, `provider` → Organization) + `WebPage`;
  canonical e `og:url` = `https://legalhealthbr.app/`.
- `src/routes/embaixadores.tsx`: `WebPage` + `BreadcrumbList`.
- `termos.tsx`, `privacidade.tsx`, `retencao-de-dados.tsx`,
  `canal-de-privacidade.tsx`: `WebPage` + `BreadcrumbList`, canonical e `og:url`
  próprios.
- Base de URLs numa constante única (`src/lib/seo.ts`) para não repetir o domínio.
- Nada de banco de dados, nenhuma mudança visual, nenhuma alteração no
  `robots.txt` ou no sitemap.

Depois de aprovado e publicado, dá para conferir o resultado no teste de
resultados aprimorados do Google e no Search Console.
