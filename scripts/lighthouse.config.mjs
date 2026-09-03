// Configuração compartilhada das auditorias Lighthouse.
// Ajuste rotas e metas aqui — os scripts leem deste arquivo.

/** Rotas públicas medidas por padrão (não exigem sessão). */
export const ROTAS = [
  { caminho: "/", nome: "landing" },
  { caminho: "/embaixadores", nome: "embaixadores" },
  { caminho: "/auth", nome: "auth" },
];

/** Metas mínimas por categoria (0-100). Falhar abaixo disso encerra com erro. */
export const METAS = {
  mobile: {
    performance: 80,
    accessibility: 95,
    "best-practices": 90,
    seo: 95,
  },
  desktop: {
    performance: 90,
    accessibility: 95,
    "best-practices": 90,
    seo: 95,
  },
};

export const CATEGORIAS = ["performance", "accessibility", "best-practices", "seo"];

/** Métricas de laboratório reportadas junto das notas. */
export const METRICAS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
];

export const PASTA_RELATORIOS = ".lighthouse";
