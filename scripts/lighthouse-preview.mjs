#!/usr/bin/env node
// Faz o build de produção, sobe o servidor do build (mesmo runtime do deploy) e mede com Lighthouse.
// Uso: bun run lighthouse:build [-- --formatos=mobile --rotas=/]

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PORTA = Number(process.env.LH_PREVIEW_PORT ?? 4173);
const BASE_URL = `http://127.0.0.1:${PORTA}`;
const extras = process.argv.slice(2);
const PULAR_BUILD = extras.includes("--sem-build");
const argsLighthouse = extras.filter((a) => a !== "--sem-build");

function executar(comando, args) {
  return new Promise((resolver, rejeitar) => {
    const p = spawn(comando, args, { stdio: "inherit" });
    p.on("error", rejeitar);
    p.on("exit", (codigo) =>
      codigo === 0 ? resolver() : rejeitar(new Error(`${comando} saiu com código ${codigo}`)),
    );
  });
}

async function esperar(url, tentativas = 90) {
  for (let i = 0; i < tentativas; i += 1) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* servidor ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

/**
 * O build gera um worker (preset cloudflare-module), então o servidor de preview é o wrangler.
 * `vite preview` não serve este formato.
 */
function comandoServidor() {
  if (existsSync("dist/server/wrangler.json")) {
    return [
      "npx",
      [
        "wrangler",
        "dev",
        "--config",
        "dist/server/wrangler.json",
        "--port",
        String(PORTA),
        "--ip",
        "127.0.0.1",
      ],
    ];
  }
  return ["npx", ["vite", "preview", "--port", String(PORTA), "--strictPort"]];
}

if (!PULAR_BUILD) {
  console.log("→ build de produção");
  await executar("npx", ["vite", "build"]);
} else if (!existsSync("dist/server")) {
  console.error("✖ --sem-build exige um build anterior em dist/.");
  process.exit(1);
}

if (existsSync("dist/nitro.json")) {
  const nitro = JSON.parse(readFileSync("dist/nitro.json", "utf8"));
  console.log(`→ runtime do build: ${nitro.preset}`);
}

const [cmd, args] = comandoServidor();
console.log(`→ subindo o build em ${BASE_URL}`);
const servidor = spawn(cmd, args, { stdio: ["ignore", "ignore", "inherit"] });

let codigoSaida = 0;
try {
  const pronto = await esperar(`${BASE_URL}/`);
  if (!pronto) throw new Error("o servidor do build não respondeu em tempo");
  await executar("node", ["scripts/lighthouse.mjs", `--url=${BASE_URL}`, ...argsLighthouse]);
} catch (erro) {
  console.error(`✖ ${erro.message ?? erro}`);
  codigoSaida = 1;
} finally {
  servidor.kill("SIGTERM");
}

process.exit(codigoSaida);
