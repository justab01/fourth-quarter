import { Router, type IRouter } from "express";
import https from "https";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Cache ────────────────────────────────────────────────────────────────────
interface CacheEntry { data: unknown; expiresAt: number }
const newsCache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = newsCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number): void {
  newsCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Image filter ─────────────────────────────────────────────────────────────
// ESPN's first image for game-preview articles is always an auto-generated
// matchup graphic (two team logos side by side). We only want real photos.
// Real ESPN photos: type === "header" OR the URL path includes "/photo/"
// Generated matchup graphics: URL contains "/combiner/" or "/teamlogos/"
function getArticlePhoto(images: any[]): string | null {
  if (!images?.length) return null;
  const isRealPhoto = (img: any) =>
    img?.url &&
    !img.url.includes("/combiner/") &&
    !img.url.includes("/teamlogos/") &&
    (img.type === "header" || img.url.includes("/photo/"));
  const photo = images.find(isRealPhoto);
  return photo?.url ?? null;
}

// ─── ESPN response shapes ─────────────────────────────────────────────────────
interface EspnNewsCategory {
  type: string;
  description?: string;
  team?: { description?: string };
}

interface EspnNewsImage {
  url: string;
}

interface EspnNewsLinks {
  web?: { href: string };
}

interface EspnNewsArticle {
  id?: number | string;
  nowId?: string;
  dataSourceIdentifier?: string;
  headline?: string;
  description?: string;
  published?: string;
  lastModified?: string;
  images?: EspnNewsImage[];
  categories?: EspnNewsCategory[];
  links?: EspnNewsLinks;
}

interface EspnNewsResponse {
  articles?: EspnNewsArticle[];
}

interface EspnContentHeadline {
  story?: string;
}

interface EspnContentResponse {
  headlines?: EspnContentHeadline[];
}

// ─── Mapped output shape (matches NewsArticle in mobile/utils/api.ts) ─────────
interface MappedArticle {
  id: string;
  rawId: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  tags: string[];
  teams: string[];
  leagues: string[];
}

// ─── ESPN fetchers ────────────────────────────────────────────────────────────
function espnFetch(url: string): Promise<EspnNewsResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let raw = "";
      res.on("data", (chunk: string) => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw) as EspnNewsResponse); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("ESPN news timeout")); });
  });
}

function espnContentFetch(url: string): Promise<EspnContentResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let raw = "";
      res.on("data", (chunk: string) => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw) as EspnContentResponse); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(6000, () => { req.destroy(); reject(new Error("ESPN content timeout")); });
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

async function fetchStory(rawId: string): Promise<string | null> {
  if (!rawId || !/^\d+$/.test(rawId)) return null;
  try {
    const json = await espnContentFetch(
      `https://content.core.api.espn.com/v1/sports/news/${rawId}`
    );
    const story = json.headlines?.[0]?.story;
    return typeof story === "string" && story.length > 0
      ? stripHtml(story).slice(0, 3000)
      : null;
  } catch {
    return null;
  }
}

// ─── League mapping ───────────────────────────────────────────────────────────
const LEAGUE_EXACT: Record<string, string> = {
  NBA: "NBA", NFL: "NFL", MLB: "MLB", MLS: "MLS", NHL: "NHL",
  BASEBALL: "MLB", "MAJOR LEAGUE BASEBALL": "MLB",
  "MAJOR LEAGUE SOCCER": "MLS",
  "NATIONAL HOCKEY LEAGUE": "NHL", HOCKEY: "NHL",
  NCAAB: "NCAAB", NCAAF: "NCAAF", NCAA: "NCAAB",
  "COLLEGE FOOTBALL": "NCAAF", "COLLEGE BASKETBALL": "NCAAB",
  ATP: "ATP", WTA: "WTA", TENNIS: "ATP",
  UFC: "UFC", MMA: "UFC", "MIXED MARTIAL ARTS": "UFC",
  BOXING: "BOXING",
  PGA: "PGA", "PGA TOUR": "PGA", GOLF: "PGA",
  F1: "F1", "FORMULA 1": "F1", "FORMULA ONE": "F1",
  NASCAR: "NASCAR",
  EPL: "EPL", "ENGLISH PREMIER LEAGUE": "EPL", "PREMIER LEAGUE": "EPL",
  UCL: "UCL", "UEFA CHAMPIONS LEAGUE": "UCL", "CHAMPIONS LEAGUE": "UCL",
  LIGA: "LIGA", "LA LIGA": "LIGA", "SPANISH PRIMERA DIVISION": "LIGA",
  WNBA: "WNBA",
};

function normalizeLeague(desc: string): string | null {
  return LEAGUE_EXACT[desc.toUpperCase().trim()] ?? null;
}

const LEAGUE_NEWS_URLS: Record<string, string> = {
  NBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=15",
  NFL: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=15",
  MLB: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=15",
  NHL: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news?limit=12",
  MLS: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news?limit=10",
  EPL: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=10",
  NCAAB: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news?limit=10",
  NCAAF: "https://site.api.espn.com/apis/site/v2/sports/football/college-football/news?limit=10",
  ATP: "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/news?limit=10",
  UFC: "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/news?limit=10",
  PGA: "https://site.api.espn.com/apis/site/v2/sports/golf/pga/news?limit=10",
  F1: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=10",
  WNBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/news?limit=8",
};

// ─── Article mapping ──────────────────────────────────────────────────────────
function mapArticle(raw: EspnNewsArticle, defaultLeague: string): MappedArticle {
  const cats: EspnNewsCategory[] = raw.categories ?? [];

  const leagueSet = new Set<string>();
  for (const c of cats) {
    if (c.type === "league" && c.description) {
      const mapped = normalizeLeague(c.description);
      if (mapped) leagueSet.add(mapped);
    }
  }
  if (leagueSet.size === 0) leagueSet.add(defaultLeague);

  const teams: string[] = cats
    .filter((c) => c.type === "team")
    .map((c) => c.team?.description ?? c.description ?? "")
    .filter((s): s is string => s.length > 0);

  const tags: string[] = cats
    .filter((c) => c.type === "topic" || c.type === "athlete")
    .map((c) => c.description ?? "")
    .filter((s): s is string => s.length > 0);

  // Use ESPN's numeric ID if present; fall back to a hash of headline+published
  // to guarantee uniqueness even if ESPN omits the id field.
  const providedId = raw.id ?? raw.nowId ?? raw.dataSourceIdentifier;
  const rawId = providedId != null
    ? String(providedId)
    : crypto.createHash("md5").update(`${raw.headline ?? ""}|${raw.published ?? ""}`).digest("hex").slice(0, 12);
  const id = `espn-${rawId}`;
  const sourceUrl = raw.links?.web?.href ?? `https://www.espn.com/${defaultLeague.toLowerCase()}/`;
  const imageUrl = getArticlePhoto(raw.images ?? []);
  const fallbackText = raw.description ?? raw.headline ?? "";

  return {
    id,
    rawId,
    title: raw.headline ?? "Sports Update",
    summary: fallbackText,
    content: fallbackText,
    source: "ESPN",
    sourceUrl,
    imageUrl,
    publishedAt: raw.published ?? raw.lastModified ?? new Date().toISOString(),
    tags,
    teams,
    leagues: Array.from(leagueSet),
  };
}

// ─── Fetch all leagues + enrich stories ──────────────────────────────────────
async function fetchAllNews(): Promise<Omit<MappedArticle, "rawId">[]> {
  const cacheKey = "news-all";
  const cached = getCached<Omit<MappedArticle, "rawId">[]>(cacheKey);
  if (cached) return cached;

  const results = await Promise.allSettled(
    Object.entries(LEAGUE_NEWS_URLS).map(async ([league, url]) => {
      const json = await espnFetch(url);
      return (json.articles ?? []).map((a) => mapArticle(a, league));
    })
  );

  const articles: MappedArticle[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const a of r.value) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          articles.push(a);
        }
      }
    }
  }

  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Enrich the top 20 articles with full story text from ESPN content API
  const TOP_STORY_COUNT = 20;
  await Promise.allSettled(
    articles.slice(0, TOP_STORY_COUNT).map(async (article) => {
      if (article.rawId) {
        const story = await fetchStory(article.rawId);
        if (story) article.content = story;
      }
    })
  );

  const output = articles.map(({ rawId: _raw, ...rest }) => rest);
  setCached(cacheKey, output, 120_000);
  return output;
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.get("/news", async (req, res) => {
  const { teams, leagues } = req.query as { teams?: string; leagues?: string };

  try {
    let articles = await fetchAllNews();

    if (teams) {
      const teamList = teams.split(",").map((t) => t.trim().toLowerCase());
      const filtered = articles.filter((a) =>
        a.teams.some((t) => teamList.some((tl) => t.toLowerCase().includes(tl)))
      );
      if (filtered.length > 0) articles = filtered;
    }

    if (leagues) {
      const leagueList = leagues.split(",").map((l) => l.trim().toUpperCase());
      const filtered = articles.filter((a) =>
        a.leagues.some((l) => leagueList.includes(l))
      );
      if (filtered.length > 0) articles = filtered;
    }

    res.json({ articles });
  } catch (err) {
    console.error("News fetch error:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
