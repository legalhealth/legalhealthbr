# Validar e ampliar os dados estruturados

## 1. Validação dos dados estruturados

Vou extrair os dados estruturados de cada uma das seis páginas públicas como o
Google os lê e validá-los, corrigindo tudo que aparecer como erro ou aviso:

- Campos obrigatórios ausentes ou vazios.
- Endereços de página, logomarca e links que não abrem.
- Tipos declarados incorretamente ou ligações quebradas entre os blocos
  (empresa, site, página, trilha de navegação).

O teste oficial do Google só consegue ler o endereço público, então a validação
final é feita depois da publicação; antes disso valido o conteúdo gerado pelas
páginas, que é exatamente o mesmo.

## 2. Propriedades novas

**Empresa (todas as páginas)**
- Perfil oficial no Instagram (`instagram.com/legalhealthbr`) declarado como
  perfil da empresa — é isso que permite ao Google associar o perfil ao site.
- Nome alternativo curto ("Legal Health"), área de atuação (Brasil), idioma de
  atendimento e o e-mail de contato já existente.
- Logomarca declarada com dimensões, como o Google recomenda.

**Site**
- Ligação explícita entre site, empresa e cada página.
- Idioma e detentor dos direitos do conteúdo.

Não vou declarar CNPJ, telefone nem endereço físico, conforme sua escolha —
somente o que já está no site.

## 3. Acompanhamento no Search Console

Depois de publicar, consulto no Search Console o que o Google já detectou para a
página inicial e para uma página institucional: quais aprimoramentos foram
reconhecidos, se há erro de leitura e como está a indexação. Trago o resultado em
texto simples.

Importante: o Google lê os dados na próxima vez que rastreia o site, o que pode
levar de alguns dias a algumas semanas. Se ele ainda não tiver rastreado, o
Search Console mostrará o estado anterior — vou dizer claramente quando for esse
o caso, em vez de apresentar como problema.

## Detalhes técnicos

- `src/lib/seo.ts`: `organizationLd` ganha `alternateName`, `sameAs`
  (`https://www.instagram.com/legalhealthbr`), `areaServed: Brasil`,
  `knowsLanguage: pt-BR` e `logo` como `ImageObject` (`url`, `width`, `height`
  de `/pwa-192.png`); `webSiteLd` ganha `copyrightHolder` → `@id` da Organization.
  Nenhuma alteração de layout.
- Validação: extrair cada `<script type="application/ld+json">` do HTML servido
  pelas seis rotas, conferir JSON válido, resolução dos `@id` dentro do `@graph`,
  presença dos campos exigidos por tipo, e checar por HTTP que logomarca,
  canonical e `sameAs` respondem 200. Não invento resultados de ferramenta
  externa: relato o que a validação executada mostrar.
- Publicação necessária para o teste oficial do Google e para o Search Console
  verem as mudanças; peço aprovação da publicação.
- Search Console: `POST /v1/urlInspection/index:inspect` na propriedade
  verificada `https://legalhealthbr.app/` para `/` e `/privacidade`, lendo
  `richResultsResult` e o estado de indexação. Essa chamada apenas lê o estado
  no índice do Google — não força novo rastreamento.
