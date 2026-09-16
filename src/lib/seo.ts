// Dados estruturados (Schema.org) das páginas públicas.
// Só declaramos informações que já existem no site: nada inventado.

export const SITE_URL = "https://legalhealthbr.app";
export const SITE_NAME = "Legal Health";
export const SITE_DESCRIPTION =
  "Plataforma de inteligência jurídica preventiva para profissionais e clínicas de saúde no Brasil.";
export const CONTATO_EMAIL = "contato@legalhealthbr.app";

export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

export function abs(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export const organizationLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  logo: `${SITE_URL}/pwa-192.png`,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTATO_EMAIL,
      availableLanguage: ["Portuguese"],
    },
  ],
};

export const webSiteLd = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: "pt-BR",
  publisher: { "@id": ORG_ID },
};

export function webPageLd(input: {
  path: string;
  name: string;
  description: string;
  tipo?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  return {
    "@type": input.tipo ?? "WebPage",
    "@id": `${abs(input.path)}#webpage`,
    url: abs(input.path),
    name: input.name,
    description: input.description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": SITE_ID },
  };
}

export function breadcrumbLd(itens: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/** Envolve os nós num @graph e devolve o script pronto para o head(). */
export function jsonLdScript(nodes: unknown[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }),
  };
}

/** Script JSON-LD de uma página institucional simples (WebPage + trilha). */
export function paginaLdScript(input: {
  path: string;
  name: string;
  description: string;
  breadcrumbLabel: string;
  tipo?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  return jsonLdScript([
    webPageLd(input),
    breadcrumbLd([
      { name: "Início", path: "/" },
      { name: input.breadcrumbLabel, path: input.path },
    ]),
  ]);
}
