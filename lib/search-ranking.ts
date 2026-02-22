import { SearchResult, SearchSuggestion, SearchWeightConfig, Song } from "@/types/song";

const DEFAULT_WEIGHTS: SearchWeightConfig = {
  title_exact: 100,
  title_partial: 60,
  chorus_weight: 55,
  verse1_weight: 45,
  lyrics_weight: 20,
  unit_weight: 15,
  fuzzy_weight: 10
};

function normalize(input: unknown) {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesQuery(field: unknown, query: string) {
  const normalizedField = normalize(field);
  if (!normalizedField || !query) return false;
  if (normalizedField.includes(query)) return true;

  // "주님 사랑" should also match when words are separated in stored text.
  const tokens = query.split(" ").filter(Boolean);
  if (tokens.length <= 1) return false;
  return tokens.every((token) => normalizedField.includes(token));
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getBaseScore(song: Song, query: string, weights: SearchWeightConfig) {
  const matchedFields: string[] = [];
  let score = 0;
  const q = normalize(query);
  const title = normalize(song.title);

  if (!q) {
    return { score, matchedFields };
  }

  if (title === q) {
    score += weights.title_exact;
    matchedFields.push("title_exact");
  } else if (title.includes(q)) {
    score += weights.title_partial;
    matchedFields.push("title_partial");
  }

  if (includesQuery(song.chorus_first_line, q)) {
    score += weights.chorus_weight;
    matchedFields.push("chorus_first_line");
  }

  if (includesQuery(song.verse1_first_line, q)) {
    score += weights.verse1_weight;
    matchedFields.push("verse1_first_line");
  }

  if (includesQuery(song.lyrics_full, q)) {
    score += weights.lyrics_weight;
    matchedFields.push("lyrics_full");
  }

  const units = Array.isArray(song.two_line_units) ? song.two_line_units : [];
  if (units.some((unit) => includesQuery(unit, q))) {
    score += weights.unit_weight;
    matchedFields.push("two_line_units");
  }

  return { score, matchedFields };
}

export function mergeWithDefaultWeights(
  config: Partial<SearchWeightConfig> | null | undefined
): SearchWeightConfig {
  return { ...DEFAULT_WEIGHTS, ...(config ?? {}) };
}

export function rankSongs(
  songs: Song[],
  query: string,
  config: SearchWeightConfig
): SearchResult[] {
  const weights = mergeWithDefaultWeights(config);
  return songs
    .map((song) => {
      const { score, matchedFields } = getBaseScore(song, query, weights);
      return { song, score, matched_fields: matchedFields };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title));
}

function getTitleDistance(song: Song, query: string) {
  const q = normalize(query);
  const title = normalize(song.title);
  if (!q || !title) return Number.POSITIVE_INFINITY;
  return levenshtein(title, q);
}

export function buildSuggestions(
  songs: Song[],
  query: string,
  config: SearchWeightConfig,
  limit = 8
): SearchSuggestion[] {
  const q = normalize(query);
  if (!q) return [];

  const weights = mergeWithDefaultWeights(config);
  const maxDistance = Math.max(1, Math.floor(q.length * 0.45));

  return songs
    .map((song) => {
      const distance = getTitleDistance(song, q);
      const inFuzzyRange = distance <= maxDistance;
      if (!inFuzzyRange) return null;

      const { score } = getBaseScore(song, q, weights);
      const suggestionScore = score + weights.fuzzy_weight;

      return {
        song_id: song.id,
        title: song.title,
        score: suggestionScore,
        distance
      } satisfies SearchSuggestion;
    })
    .filter((item): item is SearchSuggestion => Boolean(item))
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export { DEFAULT_WEIGHTS };
