// One-time sourcing helper for MLB ballpark photos.
// Pulls each park's lead image from Wikipedia (free-license / Wikimedia Commons),
// downloads originals to assets/ballparks/_src, and writes a manifest for
// attribution + a human verification pass. Optimize with optimize-ballparks.mjs.
//
// Run: node artifacts/mobile/scripts/fetch-ballparks.mjs
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "assets", "ballparks", "_src");
const MANIFEST = join(__dirname, "..", "assets", "ballparks", "_manifest.json");

// venue = the string the API feed emits (game.venue); wikiTitle = Wikipedia
// article; slug = asset filename. aliases = other feed spellings that map here.
const PARKS = [
  { venue: "American Family Field", wikiTitle: "American Family Field", slug: "american-family-field" },
  { venue: "Angel Stadium", wikiTitle: "Angel Stadium", slug: "angel-stadium" },
  { venue: "Busch Stadium", wikiTitle: "Busch Stadium", slug: "busch-stadium" },
  { venue: "Chase Field", wikiTitle: "Chase Field", slug: "chase-field" },
  { venue: "Citi Field", wikiTitle: "Citi Field", slug: "citi-field" },
  { venue: "Citizens Bank Park", wikiTitle: "Citizens Bank Park", slug: "citizens-bank-park" },
  { venue: "Comerica Park", wikiTitle: "Comerica Park", slug: "comerica-park" },
  { venue: "Coors Field", wikiTitle: "Coors Field", slug: "coors-field" },
  { venue: "Daikin Park", wikiTitle: "Daikin Park", slug: "daikin-park", aliases: ["Minute Maid Park"] },
  { venue: "Dodger Stadium", wikiTitle: "Dodger Stadium", slug: "dodger-stadium" },
  { venue: "Fenway Park", wikiTitle: "Fenway Park", slug: "fenway-park" },
  { venue: "Globe Life Field", wikiTitle: "Globe Life Field", slug: "globe-life-field" },
  { venue: "Great American Ball Park", wikiTitle: "Great American Ball Park", slug: "great-american-ball-park" },
  { venue: "Kauffman Stadium", wikiTitle: "Kauffman Stadium", slug: "kauffman-stadium" },
  { venue: "loanDepot Park", wikiTitle: "LoanDepot Park", slug: "loandepot-park" },
  { venue: "Nationals Park", wikiTitle: "Nationals Park", slug: "nationals-park" },
  { venue: "Oracle Park", wikiTitle: "Oracle Park", slug: "oracle-park" },
  { venue: "Oriole Park at Camden Yards", wikiTitle: "Oriole Park at Camden Yards", slug: "camden-yards" },
  { venue: "PNC Park", wikiTitle: "PNC Park", slug: "pnc-park" },
  { venue: "Petco Park", wikiTitle: "Petco Park", slug: "petco-park" },
  { venue: "Progressive Field", wikiTitle: "Progressive Field", slug: "progressive-field" },
  { venue: "Rate Field", wikiTitle: "Rate Field", slug: "rate-field", aliases: ["Guaranteed Rate Field"] },
  { venue: "Rogers Centre", wikiTitle: "Rogers Centre", slug: "rogers-centre" },
  { venue: "Sutter Health Park", wikiTitle: "Sutter Health Park", slug: "sutter-health-park" },
  { venue: "T-Mobile Park", wikiTitle: "T-Mobile Park", slug: "t-mobile-park" },
  { venue: "Target Field", wikiTitle: "Target Field", slug: "target-field" },
  { venue: "George M. Steinbrenner Field", wikiTitle: "George M. Steinbrenner Field", slug: "steinbrenner-field", aliases: ["Tropicana Field"] },
  { venue: "Truist Park", wikiTitle: "Truist Park", slug: "truist-park" },
  { venue: "Wrigley Field", wikiTitle: "Wrigley Field", slug: "wrigley-field" },
  { venue: "Yankee Stadium", wikiTitle: "Yankee Stadium", slug: "yankee-stadium" },
];

const UA = "FourthQuarterApp/1.0 (ballpark image sourcing; contact: dev@fourthquarter.app)";

const isPhoto = (u) => /\.(jpe?g|png)$/i.test((u || "").split("?")[0]);
const looksLikeChrome = (name) => /logo|icon|seal|map|svg|wordmark|diagram|plan\b/i.test(name);

async function apiJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) { await sleep(5000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }
  throw new Error("API 429 (gave up)");
}

// First real photo on the page (used when the infobox lead image is an SVG logo).
async function firstPhotoFromPage(title) {
  const listUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&imlimit=60&redirects=1&titles=${encodeURIComponent(title)}`;
  const data = await apiJson(listUrl);
  const page = Object.values(data?.query?.pages ?? {})[0];
  const files = (page?.images ?? [])
    .map((x) => x.title)
    .filter((t) => /\.(jpe?g|png)$/i.test(t) && !looksLikeChrome(t));
  for (const file of files.slice(0, 6)) {
    const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(file)}`;
    const info = await apiJson(infoUrl);
    const ip = Object.values(info?.query?.pages ?? {})[0];
    const src = ip?.imageinfo?.[0]?.url;
    if (src && isPhoto(src)) return src;
    await sleep(300);
  }
  return null;
}

async function leadImageUrl(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&redirects=1&titles=${encodeURIComponent(title)}`;
  const data = await apiJson(url);
  const page = Object.values(data?.query?.pages ?? {})[0];
  const src = page?.original?.source ?? null;
  if (src && isPhoto(src)) return src;
  // lead is an SVG logo (or missing) → find the first real photo on the page
  return firstPhotoFromPage(title);
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) { await sleep(6000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`download ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    return;
  }
  throw new Error("download 429 (gave up)");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir(SRC_DIR, { recursive: true });
  const existing = new Set(await readdir(SRC_DIR).catch(() => []));
  const hasPhoto = (slug) => [...existing].some((f) => new RegExp(`^${slug}\\.src\\.(jpe?g|png)$`, "i").test(f));
  const manifest = [];
  for (const park of PARKS) {
    if (hasPhoto(park.slug)) { console.log(`• ${park.slug}: already have photo, skip`); manifest.push({ ...park, skipped: true }); continue; }
    try {
      const src = await leadImageUrl(park.wikiTitle);
      if (!src) { console.log(`✗ ${park.slug}: no photo found`); manifest.push({ ...park, source: null, file: null }); continue; }
      const ext = (src.split(".").pop() || "jpg").split("?")[0].toLowerCase();
      const file = `${park.slug}.src.${ext}`;
      await download(src, join(SRC_DIR, file));
      console.log(`✓ ${park.slug}: ${src}`);
      manifest.push({ ...park, source: src, file });
    } catch (e) {
      console.log(`✗ ${park.slug}: ${e.message}`);
      manifest.push({ ...park, source: null, file: null, error: e.message });
    }
    await sleep(1200); // be polite to Wikimedia
  }
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  const ok = manifest.filter((m) => m.file).length;
  console.log(`\nDone: ${ok}/${PARKS.length} sourced. Manifest: ${MANIFEST}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
