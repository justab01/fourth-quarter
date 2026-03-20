import { Router, type IRouter } from "express";
import https from "https";

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

// ─── Mapped output shape (matches NewsArticle in mobile/utils/api.ts) ─────────
interface MappedArticle {
  id: string;
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

// ─── ESPN fetch ───────────────────────────────────────────────────────────────
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

// ─── League mapping ───────────────────────────────────────────────────────────
const LEAGUE_EXACT: Record<string, string> = {
  NBA: "NBA", NFL: "NFL", MLB: "MLB", MLS: "MLS",
  BASEBALL: "MLB", "MAJOR LEAGUE BASEBALL": "MLB",
  "MAJOR LEAGUE SOCCER": "MLS",
  NCAAB: "NCAA", NCAAF: "NCAA",
  "COLLEGE FOOTBALL": "NCAA", "COLLEGE BASKETBALL": "NCAA",
};

function normalizeLeague(desc: string): string | null {
  return LEAGUE_EXACT[desc.toUpperCase().trim()] ?? null;
}

const LEAGUE_NEWS_URLS: Record<string, string> = {
  NBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=15",
  NFL: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=15",
  MLB: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=15",
  MLS: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news?limit=10",
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

  const rawId = raw.id ?? raw.nowId ?? raw.dataSourceIdentifier ?? String(Math.random());
  const id = `espn-${rawId}`;
  const sourceUrl = raw.links?.web?.href ?? `https://www.espn.com/${defaultLeague.toLowerCase()}/`;
  const imageUrl = raw.images?.[0]?.url ?? null;
  const text = raw.description ?? raw.headline ?? "";

  return {
    id,
    title: raw.headline ?? "Sports Update",
    summary: text,
    content: text,
    source: "ESPN",
    sourceUrl,
    imageUrl,
    publishedAt: raw.published ?? raw.lastModified ?? new Date().toISOString(),
    tags,
    teams,
    leagues: Array.from(leagueSet),
  };
}

// ─── Fetch all leagues in parallel ───────────────────────────────────────────
async function fetchAllNews(): Promise<MappedArticle[]> {
  const cacheKey = "news-all";
  const cached = getCached<MappedArticle[]>(cacheKey);
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
  setCached(cacheKey, articles, 120_000);
  return articles;
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
