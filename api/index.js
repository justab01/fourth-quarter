// ─── Vercel serverless entry for the Fourth Quarter API ──────────────────────
//
// Loads the pre-bundled Express app and exports it as the request handler.
//
// WHY a pre-built bundle (../_api-bundle.cjs):
//   The api-server package is ESM ("type":"module") and imports TS-source
//   workspace libs (@workspace/db, @workspace/api-zod). Vercel's per-file TS
//   transpile compiled this wrapper to CommonJS and then hit ERR_REQUIRE_ESM
//   trying to require the ESM app (and would not have compiled the workspace TS
//   at all). scripts/vercel-build.sh runs esbuild during the Vercel build to
//   inline app.ts + routes + the workspace TS + deps into ONE CommonJS file with
//   NODE_ENV baked to "production" (which drops the dev-only pino-pretty
//   transport). This wrapper just re-exports that bundle's Express app — no
//   module-system boundary remains.
const mod = require("../_api-bundle.cjs");
module.exports = mod && mod.default ? mod.default : mod;
