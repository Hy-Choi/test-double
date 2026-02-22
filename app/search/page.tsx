"use client";

import { FormEvent } from "react";
import Link from "next/link";
import SearchResultCard from "@/components/SearchResultCard";
import { useSongSearch } from "@/hooks/useSongSearch";
import { getSongMetaLabel } from "@/lib/song-meta";
import { SearchWeightConfig } from "@/types/song";

const initialWeights: SearchWeightConfig = {
  title_exact: 100,
  title_partial: 60,
  chorus_weight: 55,
  verse1_weight: 45,
  lyrics_weight: 20,
  unit_weight: 15,
  fuzzy_weight: 10
};

export default function SearchPage() {
  const { query, setQuery, results, suggestions, weights, loading, error, searchNow } = useSongSearch({
    initialWeights,
    includeSuggestions: true
  });

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    void searchNow();
  };

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <h1 className="text-3xl font-black text-strong">Search Engine</h1>
        <p className="mt-2 text-sm text-soft">title / chorus_first_line / verse1_first_line / lyrics_full / two_line_units</p>

        <form className="mt-5 flex gap-3" onSubmit={runSearch}>
          <input
            className="input flex-1"
            placeholder="곡 제목 또는 가사 일부를 입력하세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn-primary min-w-[120px]" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <p className="mt-2 text-xs font-semibold text-muted">입력 즉시 DB 결과가 아래에 표시됩니다.</p>

        {query.trim() ? (
          <div className="mt-3 rounded-[2px] border-2 border-soft bg-solid p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">DB Matches ({results.length})</p>
            <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-sm text-muted">검색 중...</p>
              ) : results.length > 0 ? (
                results.slice(0, 12).map((result, index) => (
                  <Link
                    key={`${result.song.id}-${index}`}
                    href={`/song/${encodeURIComponent(result.song.id)}/index`}
                    prefetch={false}
                    className="block rounded-[2px] border border-soft bg-panel px-3 py-2 text-sm transition hover:border-[var(--primary)]"
                  >
                    <p className="text-[11px] font-medium text-muted">{getSongMetaLabel(result.song)}</p>
                    <p className="font-semibold text-strong">{result.song.title}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted">일치하는 곡이 없습니다.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4">
          <p>Title Exact: {weights.title_exact}</p>
          <p>Title Partial: {weights.title_partial}</p>
          <p>Chorus: {weights.chorus_weight}</p>
          <p>Verse1: {weights.verse1_weight}</p>
          <p>Lyrics: {weights.lyrics_weight}</p>
          <p>Two-line Units: {weights.unit_weight}</p>
          <p>Fuzzy Bonus (suggestions): {weights.fuzzy_weight}</p>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-strong">Results ({results.length})</h2>
          {results.length > 0 ? (
            results.map((result, index) => <SearchResultCard key={`${result.song.id}-${index}`} result={result} />)
          ) : (
            <div className="panel p-6 text-sm text-soft">검색 결과가 없습니다.</div>
          )}
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="text-base font-semibold text-strong">Suggestions (Fuzzy)</h2>
          <p className="mt-1 text-xs text-muted">Fuzzy bonus applies only here.</p>
          <div className="mt-4 space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map((item) => (
                <Link
                  key={item.song_id}
                  href={`/song/${encodeURIComponent(item.song_id)}/index`}
                  prefetch={false}
                  className="block rounded-lg border border-soft bg-panel px-3 py-2 text-sm transition hover:border-[var(--primary)]"
                >
                  <p className="font-semibold text-strong">{item.title}</p>
                  <p className="text-xs text-muted">
                    score {item.score} / distance {item.distance}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">추천 결과가 없습니다.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
