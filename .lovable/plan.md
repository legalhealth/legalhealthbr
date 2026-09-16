# Google Search Console: conectar, verificar, publicar e enviar o sitemap

## O que será feito

1. **Conectar a conta do Google** — abro o cartão de conexão para você autorizar o Google Search Console aqui no chat.

2. **Criar o sitemap** — hoje o site não tem `sitemap.xml`. Crio um sitemap estático em `public/sitemap.xml` com as páginas públicas do domínio principal `https://legalhealthbr.app`:
   - `/` (landing)
   - `/embaixadores`
   - `/termos`
   - `/privacidade`
   - `/retencao-de-dados`
   - `/canal-de-privacidade`

   Páginas de login e áreas internas ficam fora. Sem campo de data de modificação (não há data real por página). Adiciono a linha `Sitemap: https://legalhealthbr.app/sitemap.xml` ao `public/robots.txt`, preservando os blocos existentes.

3. **Tag de verificação do Google** — peço o token de verificação (meta tag) e o adiciono ao cabeçalho do site em `src/routes/__root.tsx`.

4. **Publicar** — publico o site para que a tag de verificação e o sitemap fiquem no ar (é a única forma de o Google confirmar a propriedade).

5. **Verificar e registrar** — confirmo a tag no ar, aviso o Google para verificar a propriedade `https://legalhealthbr.app/` e a adiciono ao seu Search Console.

6. **Enviar o sitemap** — submeto `https://legalhealthbr.app/sitemap.xml` ao Search Console e marco o aviso de SEO como resolvido.

## Observações

- Uso o domínio principal `legalhealthbr.app` (não o endereço `lovable.app`), pois é o endereço público do site. A verificação cobre todas as páginas desse endereço.
- A indexação pelo Google não é imediata: após o envio, o site pode levar de dias a algumas semanas para aparecer nos resultados.
- Você só precisa aprovar duas coisas: a conexão da conta Google e a publicação.

## Detalhes técnicos

- Conexão via `standard_connectors--connect` (connector `google_search_console`); token via `siteVerification/v1/token` (método META, identifier `https://legalhealthbr.app/`); verificação via `siteVerification/v1/webResource`; registro via `PUT /webmasters/v3/sites/...`; sitemap via `PUT .../sitemaps/...`.
- Após a verificação, uma nova chamada `GET /webmasters/v3/sites` confirma a propriedade antes do envio do sitemap.
- Sitemap estático simples (poucas rotas públicas, mudam raramente); se o site ganhar páginas dinâmicas públicas no futuro, migramos para o gerador automático.
