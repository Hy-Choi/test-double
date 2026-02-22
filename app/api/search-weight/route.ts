import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_WEIGHTS, mergeWithDefaultWeights } from "@/lib/search-ranking";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SearchWeightConfig } from "@/types/song";

function parseWeightPayload(payload: Partial<SearchWeightConfig>) {
  const parsed: SearchWeightConfig = {
    title_exact: Number(payload.title_exact),
    title_partial: Number(payload.title_partial),
    chorus_weight: Number(payload.chorus_weight),
    verse1_weight: Number(payload.verse1_weight),
    lyrics_weight: Number(payload.lyrics_weight),
    unit_weight: Number(payload.unit_weight),
    fuzzy_weight: Number(payload.fuzzy_weight)
  };

  for (const [key, value] of Object.entries(parsed)) {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid number for ${key}`);
    }
  }

  return parsed;
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("search_weight_config")
      .select(
        "id,title_exact,title_partial,chorus_weight,verse1_weight,lyrics_weight,unit_weight,fuzzy_weight,updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      mergeWithDefaultWeights((data as Partial<SearchWeightConfig> | null) ?? DEFAULT_WEIGHTS)
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<SearchWeightConfig>;
    const parsed = parseWeightPayload(payload);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("search_weight_config")
      .insert([{ ...parsed }])
      .select(
        "id,title_exact,title_partial,chorus_weight,verse1_weight,lyrics_weight,unit_weight,fuzzy_weight,updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
