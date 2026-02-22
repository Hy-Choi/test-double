import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

class ValidationError extends Error {}

interface SongCreatePayload {
  title: string;
  artist?: string | null;
  chorus_first_line: string;
  verse1_first_line: string;
  two_line_units: string[];
  lyrics_full?: string | null;
  copyright_holder?: string | null;
  ccli_number?: string | null;
  tags?: string[] | null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(payload: Partial<SongCreatePayload>) {
  if (!isNonEmptyString(payload.title)) {
    throw new ValidationError("title is required");
  }
  if (!isNonEmptyString(payload.chorus_first_line)) {
    throw new ValidationError("chorus_first_line is required");
  }
  if (!isNonEmptyString(payload.verse1_first_line)) {
    throw new ValidationError("verse1_first_line is required");
  }
  if (!Array.isArray(payload.two_line_units) || payload.two_line_units.length === 0) {
    throw new ValidationError("two_line_units is required");
  }

  const invalidSlide = payload.two_line_units.find((slide) => {
    if (!isNonEmptyString(slide)) return true;
    const lines = slide
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.length === 0 || lines.length > 2;
  });

  if (invalidSlide) {
    throw new ValidationError("Each slide must have 1 or 2 lines.");
  }

  return {
    title: payload.title.trim(),
    artist: payload.artist?.trim() || null,
    chorus_first_line: payload.chorus_first_line.trim(),
    verse1_first_line: payload.verse1_first_line.trim(),
    two_line_units: payload.two_line_units.map((slide) => slide.trim()),
    lyrics_full: payload.lyrics_full?.trim() || payload.two_line_units.join("\n\n"),
    copyright_holder: payload.copyright_holder?.trim() || null,
    ccli_number: payload.ccli_number?.trim() || null,
    tags: payload.tags ?? null
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<SongCreatePayload>;
    const parsed = validatePayload(payload);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.from("songs").insert([parsed]).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const isValidation = error instanceof ValidationError;
    const message =
      error instanceof Error ? error.message : "Unknown song creation error";

    // Log full server-side error to aid debugging in terminal.
    console.error("[POST /api/songs] failed:", error);

    return NextResponse.json(
      {
        error: message,
        hint: isValidation
          ? "Check required fields and slide line counts."
          : "Check .env.local Supabase values and restart dev server."
      },
      { status: isValidation ? 400 : 500 }
    );
  }
}
