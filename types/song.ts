export type SlideText = string;

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  chorus_first_line: string;
  verse1_first_line: string;
  two_line_units: SlideText[];
  lyrics_full: string | null;
  copyright_holder: string | null;
  ccli_number: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface SearchWeightConfig {
  id?: string;
  title_exact: number;
  title_partial: number;
  chorus_weight: number;
  verse1_weight: number;
  lyrics_weight: number;
  unit_weight: number;
  fuzzy_weight: number;
  updated_at?: string;
}

export interface SearchResult {
  song: Song;
  score: number;
  matched_fields: string[];
}

export interface SearchSuggestion {
  song_id: string;
  title: string;
  score: number;
  distance: number;
}
