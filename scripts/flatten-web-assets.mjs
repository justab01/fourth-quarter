// Post-process an Expo web export so no asset path contains a `node_modules`
// segment. Vercel's uploader drops any file whose path includes `node_modules`,
// which silently strips bundled fonts (Ionicons.ttf, etc.) → icon boxes on web.
//
// Expo writes hashed assets under e.g.
//   assets/__node_modules/.pnpm/<pkg>/node_modules/@expo/vector-icons/.../Ionicons.ttf
// The top-level `__node_modules` is safe (not literally `node_modules`); the
// deeper real `node_modules` dirs are the problem. We rename those dirs to
// `nmodules` and rewrite the `/node_modules/` references in index.html and the
// JS bundles to match. Run after `expo export`, before deploying.
//
// Usage: node scripts/flatten-web-assets.mjs <web-dist-dir>
import fs from "fs";
import path from "path";

const root = process.argv[2];
if (!root || !fs.existsSync(root)) {
  console.error(`flatten-web-assets: dir not found: ${root}`);
  process.exit(1);
}

// 1) Rename every directory whose name CONTAINS "node_modules" (deepest first
//    so parent renames don't invalidate child paths). This covers both the real
//    `node_modules` dirs AND Expo's top-level `__node_modules` — Vercel's
//    uploader drops any path containing the SUBSTRING "node_modules", so the
//    `__` prefix is not enough. `node_modules` → `nmodules`, `__node_modules`
//    → `__nmodules`.
const dirs = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    walk(p);
    if (e.name.includes("node_modules")) dirs.push(p);
  }
}
const assetsDir = path.join(root, "assets");
if (fs.existsSync(assetsDir)) walk(assetsDir);
// Also collect dot-directories (e.g. `.pnpm`) — Vercel excludes dot-prefixed
// folders from the static output, which drops everything nested beneath them.
function walkDots(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    walkDots(p);
    if (e.name.startsWith(".")) dirs.push(p);
  }
}
if (fs.existsSync(assetsDir)) walkDots(assetsDir);

// Deepest first so renames never invalidate a not-yet-processed child path.
dirs.sort((a, b) => b.length - a.length);
for (const d of dirs) {
  let renamed = path.basename(d).replaceAll("node_modules", "nmodules");
  if (renamed.startsWith(".")) renamed = "_" + renamed.slice(1); // .pnpm -> _pnpm
  fs.renameSync(d, path.join(path.dirname(d), renamed));
}

// 2) Rewrite every "node_modules" reference in index.html + web JS bundles to
//    match the renamed dirs (covers "/node_modules/" and "__node_modules").
const files = [];
const indexHtml = path.join(root, "index.html");
if (fs.existsSync(indexHtml)) files.push(indexHtml);
const jsDir = path.join(root, "_expo", "static", "js", "web");
if (fs.existsSync(jsDir)) {
  for (const f of fs.readdirSync(jsDir)) {
    if (f.endsWith(".js")) files.push(path.join(jsDir, f));
  }
}
let refCount = 0;
for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  const after = before
    .replaceAll("node_modules", "nmodules")
    .replaceAll("/.pnpm/", "/_pnpm/");
  if (after !== before) refCount++;
  fs.writeFileSync(f, after);
}

// 3) Paint the web app-shell dark BEFORE React mounts. Without this the raw
//    index.html body is white, so a hard load / deep link (e.g. /sport/soccer)
//    flashes a blank white screen for a beat until the JS boots and paints the
//    dark UI. Inject a tiny inline style matching the app root BG (#0A0805).
if (fs.existsSync(indexHtml)) {
  const html = fs.readFileSync(indexHtml, "utf8");
  if (!html.includes("id=\"fq-shell-bg\"")) {
    const shellStyle =
      '<style id="fq-shell-bg">html,body,#root{background-color:#0A0805;}</style>';
    const patched = html.includes("</head>")
      ? html.replace("</head>", `${shellStyle}</head>`)
      : shellStyle + html;
    fs.writeFileSync(indexHtml, patched);
    console.log("flatten-web-assets: injected dark app-shell background into index.html");
  }
}

console.log(`flatten-web-assets: renamed ${dirs.length} node_modules dir(s), rewrote refs in ${refCount} file(s)`);
