// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { loadEnv } from "vite";

// Loads non-VITE_ env vars (server-only secrets) into process.env for server routes.
// These are never added to client-side define/env injection.
const serverEnv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

const entitiesDir = path.resolve(process.cwd(), "node_modules/entities");

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPlugin()],
    resolve: {
      // Exact-match only: a bare "entities" prefix alias would also rewrite
      // subpaths like "entities/escape" (parse5 v6 API) to the v4 copy.
      alias: [
        {
          find: /^entities\/lib\/decode\.js$/,
          replacement: path.resolve(entitiesDir, "lib/decode.js"),
        },
        {
          find: /^entities\/lib\/encode\.js$/,
          replacement: path.resolve(entitiesDir, "lib/encode.js"),
        },
        { find: /^entities$/, replacement: entitiesDir },
      ],
    },
  },
});
