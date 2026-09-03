#!/usr/bin/env node
// Faz o build de produção, sobe o preview do Vite em uma porta livre e mede com Lighthouse.
// Uso: bun run lighthouse:build

import { spawn } from "node:child_process";

const PORTA = Number(process.env.LH_PREVIEW_PORT ?? 4173);
const BASE_URL = `http://localhost:${PORTA}`;
const extras = process.argv.slice(2);

function executar(comando, args, opcoes = {}) {
  return new Promise((resolver, rejeitar) => {
    const p = spawn(comando, args, { stdio: "inherit", shell: false, ...opcoes });
    p.on("error", rejeitar);
    p.on("exit", (codigo) => (codigo === 0 ? resolver() : rejeitar(new Error(`${comando} saiu com ${codigo}`))));
  });
}

async function esperar(url, tentativas = 60) {
  for (let i = 0; i < tentativas; i += 1) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

console.log("→ build de produção");
await executar("npx", ["vite", "build"]);

console.log(`→ subindo preview em ${BASE_URL}`);
const preview = spawn("npx", ["vite", "preview", "--port", String(PORTA), "--strictPort"], {
  stdio: ["ignore", "inherit", "inherit"],
});

let codigoSaida = 0;
try {
  const pronto = await esperar(`${BASE_URL}/`);
  if (!pronto) throw new Error("preview não respondeu em 60s");
  await executar("node", ["scripts/lighthouse.mjs", `--url=${BASE_URL}`, ...extras]);
} catch (erro) {
  console.error(erro.message ?? erro);
  codigoSaida = 1;
} finally {
  preview.kill("SIGTERM");
}

process.exit(codigoSaida);
