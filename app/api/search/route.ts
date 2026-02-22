import { NextRequest, NextResponse } from "next/server";
import { buildSuggestions, DEFAULT_WEIGHTS, mergeWithDefaultWeights, rankSongs } from "@/lib/search-ranking";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SearchWeightConfig, Song } from "@/types/song";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchWeightRow = Partial<SearchWeightConfig>;

const SEARCH_WEIGHT_TTL_MS = 60_000;
const SUGGESTION_CANDIDATE_LIMIT = 250;

let cachedWeights: SearchWeightConfig | null = null;
let cachedWeightsAt = 0;

const songSelectColumns =
  "id,title,artist,chorus_first_line,verse1_first_line,two_line_units,lyrics_full,copyright_holder,ccli_number,tags,created_at";

function getCandidateLimit(query: string) {
  const length = Array.from(query.trim()).length;
  if (length <= 1) return 300;
  if (length === 2) return 450;
  return 650;
}

function parseIncludeSuggestions(rawValue: string | null) {
  if (!rawValue) return true;
  const normalized = rawValue.trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return true;
}

async function getSearchWeights() {
  const now = Date.now();
  if (cachedWeights && now - cachedWeightsAt < SEARCH_WEIGHT_TTL_MS) {
    return cachedWeights;
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("search_weight_config")
    .select(
      "id,title_exact,title_partial,chorus_weight,verse1_weight,lyrics_weight,unit_weight,fuzzy_weight,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const merged = mergeWithDefaultWeights((data as SearchWeightRow | null) ?? DEFAULT_WEIGHTS);
  cachedWeights = merged;
  cachedWeightsAt = now;

  return merged;
}

async function getCandidateSongs(query: string, candidateLimit: number): Promise<Song[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("search_song_candidates", {
    query_text: query,
    candidate_limit: candidateLimit
  });

  if (!error && Array.isArray(data)) {
    return data as Song[];
  }

  if (error) {
    console.warn("[GET /api/search] RPC fallback activated:", error.message);
  } else {
    console.warn("[GET /api/search] RPC returned invalid shape. Falling back to full scan.");
  }

  const { data: fallbackSongs, error: fallbackError } = await supabase
    .from("songs")
    .select(songSelectColumns)
    .order("created_at", { ascending: false });

  if (fallbackError) {
    throw fallbackError;
  }

  return (fallbackSongs ?? []) as Song[];
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const includeSuggestions = parseIncludeSuggestions(request.nextUrl.searchParams.get("includeSuggestions"));
    if (!query) {
      return NextResponse.json(
        {
          query,
          weights: DEFAULT_WEIGHTS,
          results: [],
          suggestions: []
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0"
          }
        }
      );
    }

    const candidateLimit = getCandidateLimit(query);
    const [rows, weights] = await Promise.all([getCandidateSongs(query, candidateLimit), getSearchWeights()]);
    const results = rankSongs(rows, query, weights).slice(0, 50);
    const suggestions = includeSuggestions
      ? buildSuggestions(rows.slice(0, SUGGESTION_CANDIDATE_LIMIT), query, weights, 8)
      : [];

    return NextResponse.json(
      {
        query,
        weights,
        results,
        suggestions
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown search error" },
      { status: 500 }
    );
  }
}
