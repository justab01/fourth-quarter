// MLB ballpark photos, bundled + keyed by the venue string the API feed emits
// (game.venue). Photos are free-license (Wikimedia Commons); see
// assets/ballparks/_manifest.json for per-park source URLs. Sourced via
// scripts/fetch-ballparks.mjs and hand-verified. Unmapped venues resolve to
// null so render sites fall back to a gradient — never a broken image.
import type { ImageSourcePropType } from "react-native";

// Keys are normalized venue names (see normalizeVenue). require() paths must be
// static literals for the RN/Metro bundler, so this map is written out in full.
const ASSETS: Record<string, ImageSourcePropType> = {
  "american family field": require("../assets/ballparks/american-family-field.jpg"),
  "angel stadium": require("../assets/ballparks/angel-stadium.jpg"),
  "busch stadium": require("../assets/ballparks/busch-stadium.jpg"),
  "chase field": require("../assets/ballparks/chase-field.jpg"),
  "citi field": require("../assets/ballparks/citi-field.jpg"),
  "citizens bank park": require("../assets/ballparks/citizens-bank-park.jpg"),
  "comerica park": require("../assets/ballparks/comerica-park.jpg"),
  "coors field": require("../assets/ballparks/coors-field.jpg"),
  "daikin park": require("../assets/ballparks/daikin-park.jpg"),
  "dodger stadium": require("../assets/ballparks/dodger-stadium.jpg"),
  "fenway park": require("../assets/ballparks/fenway-park.jpg"),
  "globe life field": require("../assets/ballparks/globe-life-field.jpg"),
  "great american ball park": require("../assets/ballparks/great-american-ball-park.jpg"),
  "kauffman stadium": require("../assets/ballparks/kauffman-stadium.jpg"),
  "loandepot park": require("../assets/ballparks/loandepot-park.jpg"),
  "nationals park": require("../assets/ballparks/nationals-park.jpg"),
  "oracle park": require("../assets/ballparks/oracle-park.jpg"),
  "oriole park at camden yards": require("../assets/ballparks/camden-yards.jpg"),
  "pnc park": require("../assets/ballparks/pnc-park.jpg"),
  "petco park": require("../assets/ballparks/petco-park.jpg"),
  "progressive field": require("../assets/ballparks/progressive-field.jpg"),
  "rate field": require("../assets/ballparks/rate-field.jpg"),
  "rogers centre": require("../assets/ballparks/rogers-centre.jpg"),
  "sutter health park": require("../assets/ballparks/sutter-health-park.jpg"),
  "t-mobile park": require("../assets/ballparks/t-mobile-park.jpg"),
  "target field": require("../assets/ballparks/target-field.jpg"),
  "george m. steinbrenner field": require("../assets/ballparks/steinbrenner-field.jpg"),
  "truist park": require("../assets/ballparks/truist-park.jpg"),
  "wrigley field": require("../assets/ballparks/wrigley-field.jpg"),
  "yankee stadium": require("../assets/ballparks/yankee-stadium.jpg"),
};

// Older / alternate names the feed may still emit → same photo as the current park.
const ALIASES: Record<string, string> = {
  "miller park": "american family field",
  "minute maid park": "daikin park",
  "guaranteed rate field": "rate field",
  "tropicana field": "george m. steinbrenner field",
  "steinbrenner field": "george m. steinbrenner field",
  "camden yards": "oriole park at camden yards",
};

function normalizeVenue(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a bundled ballpark photo for a venue name, or null when the venue is
 * unknown (caller should fall back to a gradient rather than show nothing).
 */
export function resolveBallparkImage(venue?: string | null): ImageSourcePropType | null {
  if (!venue) return null;
  const key = normalizeVenue(venue);
  const direct = ASSETS[key];
  if (direct) return direct;
  const aliased = ALIASES[key];
  return aliased ? ASSETS[aliased] ?? null : null;
}
