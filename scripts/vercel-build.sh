#!/usr/bin/env sh
# Full Vercel CI build for Fourth Quarter (runs on every GitHub push once the
# project is git-connected). Produces BOTH deployable halves from repo source:
#   1. the API serverless bundle (_api-bundle.cjs, re-exported by api/index.js)
#   2. the Expo web app (artifacts/mobile/web-dist, served as the static site)
# so nothing built locally needs to be committed.
set -e

echo "[vercel-build] 1/3 — API serverless bundle"
ESBUILD="artifacts/api-server/node_modules/.bin/esbuild"
[ -x "$ESBUILD" ] || ESBUILD="node_modules/.bin/esbuild"
"$ESBUILD" artifacts/api-server/src/app.ts \
  --bundle --platform=node --format=cjs --target=node20 \
  --define:process.env.NODE_ENV='"production"' \
  --outfile=_api-bundle.cjs

echo "[vercel-build] 2/3 — Expo web export"
# EXPO_PUBLIC_DOMAIN bakes the REST base URL (https://<domain>/api) into the web
# bundle. Defaults to the production host; override via a Vercel env var if the
# API ever moves. --clear avoids any stale Metro transform cache.
ROOT="$(pwd)"
cd artifacts/mobile
EXPO_PUBLIC_DOMAIN="${EXPO_PUBLIC_DOMAIN:-fourth-quarter.vercel.app}" \
  ./node_modules/.bin/expo export --platform web --output-dir web-dist --clear
cd "$ROOT"

echo "[vercel-build] 3/3 — flatten web asset paths"
# Vercel's uploader drops static files whose path contains `node_modules` or a
# dot-dir (.pnpm); Expo nests fonts under both. This renames those segments so
# the icon fonts actually deploy (else every icon renders as a box).
node scripts/flatten-web-assets.mjs artifacts/mobile/web-dist

echo "[vercel-build] done"
