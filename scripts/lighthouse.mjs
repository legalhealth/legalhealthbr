#!/usr/bin/env node
// Executa auditorias Lighthouse (mobile + desktop) nas rotas públicas.
//
// Uso:
//   bun run lighthouse                       # usa BASE_URL ou http://localhost:8080
//   BASE_URL=https://legalhealthbr.app bun run lighthouse
//   bun run lighthouse -- --rotas=/,/termos  # rotas específicas
//   bun run lighthouse -- --sem-metas        # só mede, não falha
//
// Relatórios HTML + JSON ficam em .lighthouse/ e o resumo vai para .lighthouse/resumo.json.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

import { CATEGORIAS, METAS, METRICAS, PASTA_RELATORIOS, ROTAS } from "./lighthouse.config.mjs";

const args = process.argv.slice(2);
const flag = (nome) =>
  args
    .find((a) => a.startsWith(`--${nome}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const temFlag = (nome) => args.includes(`--${nome}`);

const BASE_URL = (flag("url") ?? process.env.BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const APLICAR_METAS = !temFlag("sem-metas");
const FORMATOS = (flag("formatos") ?? "mobile,desktop").split(",").map((f) => f.trim());
const rotasSelecionadas = flag("rotas")
  ? flag("rotas")
      .split(",")
      .map((c) => {
        const caminho = c.trim();
        const conhecida = ROTAS.find((r) => r.caminho === caminho);
        return {
          caminho,
          nome: conhecida?.nome || caminho.replace(/^\//, "").replace(/[^\w]+/g, "-") || "raiz",
        };
      })
  : ROTAS;

/** Caminhos possíveis do Chromium já disponível no ambiente. */
function acharChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidatos = [
    "/opt/ms-playwright/chromium-1194/chrome-linux/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const achado = candidatos.find((c) => existsSync(c));
  if (achado) return achado;
  // Qualquer versão do Chromium instalada pelo Playwright.
  return undefined;
}

const PRESETS = {
  mobile: {
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
  },
  desktop: {
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
};

async function esperarServidor(url, tentativas = 30) {
  for (let i = 0; i < tentativas; i += 1) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* servidor ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function auditar(chromePort, url, formato) {
  const preset = PRESETS[formato];
  const resultado = await lighthouse(
    url,
    { port: chromePort, output: ["html", "json"], logLevel: "error" },
    {
      extends: "lighthouse:default",
      settings: {
        onlyCategories: CATEGORIAS,
        formFactor: preset.formFactor,
        screenEmulation: preset.screenEmulation,
        throttling: preset.throttling,
        throttlingMethod: "simulate",
        emulatedUserAgentDetails: undefined,
      },
    },
  );
  return resultado;
}

function nota(lhr, categoria) {
  const valor = lhr.categories[categoria]?.score;
  return valor == null ? null : Math.round(valor * 100);
}

async function main() {
  const alcancavel = await esperarServidor(`${BASE_URL}/`);
  if (!alcancavel) {
    console.error(`\n✖ Não foi possível acessar ${BASE_URL}. Suba o servidor antes de medir.`);
    process.exit(1);
  }

  const chromePath = acharChrome();
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--ignore-certificate-errors",
    ],
  });

  const destino = path.resolve(process.cwd(), PASTA_RELATORIOS);
  await mkdir(destino, { recursive: true });

  const resumo = { baseUrl: BASE_URL, executadoEm: new Date().toISOString(), execucoes: [] };
  const falhas = [];

  try {
    for (const rota of rotasSelecionadas) {
      for (const formato of FORMATOS) {
        const url = `${BASE_URL}${rota.caminho}`;
        process.stdout.write(`→ ${formato.padEnd(7)} ${url}\n`);

        const { lhr, report } = await auditar(chrome.port, url, formato);
        const [html, json] = report;
        const base = `${rota.nome}-${formato}`;
        await writeFile(path.join(destino, `${base}.html`), html, "utf8");
        await writeFile(path.join(destino, `${base}.json`), json, "utf8");

        const notas = Object.fromEntries(CATEGORIAS.map((c) => [c, nota(lhr, c)]));
        const metricas = Object.fromEntries(
          METRICAS.map((m) => [m, lhr.audits[m]?.displayValue ?? null]),
        );

        resumo.execucoes.push({
          rota: rota.caminho,
          formato,
          notas,
          metricas,
          relatorio: `${PASTA_RELATORIOS}/${base}.html`,
        });

        const metas = METAS[formato] ?? {};
        for (const [categoria, minimo] of Object.entries(metas)) {
          const atual = notas[categoria];
          if (atual != null && atual < minimo) {
            falhas.push(`${formato} ${rota.caminho} · ${categoria}: ${atual} < ${minimo}`);
          }
        }
      }
    }
  } finally {
    await chrome.kill();
  }

  await writeFile(path.join(destino, "resumo.json"), JSON.stringify(resumo, null, 2), "utf8");

  console.log(`\nResultados (${BASE_URL})`);
  console.table(
    resumo.execucoes.map((e) => ({
      rota: e.rota,
      formato: e.formato,
      perf: e.notas.performance,
      a11y: e.notas.accessibility,
      boas_praticas: e.notas["best-practices"],
      seo: e.notas.seo,
      LCP: e.metricas["largest-contentful-paint"],
      TBT: e.metricas["total-blocking-time"],
      CLS: e.metricas["cumulative-layout-shift"],
    })),
  );
  console.log(
    `Relatórios HTML em ${PASTA_RELATORIOS}/ · resumo em ${PASTA_RELATORIOS}/resumo.json`,
  );

  if (falhas.length) {
    console.error(`\n✖ Abaixo das metas:\n  - ${falhas.join("\n  - ")}`);
    if (APLICAR_METAS) process.exit(1);
  } else {
    console.log("\n✔ Todas as metas de performance e acessibilidade foram atingidas.");
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
