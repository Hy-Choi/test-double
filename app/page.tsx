"use client";

import Link from "next/link";
import { FocusEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { useSongSearch } from "@/hooks/useSongSearch";
import { getSongMetaLabel } from "@/lib/song-meta";
import ThemeToggleButton from "@/components/theme/ThemeToggleButton";
import { SearchResult, SearchWeightConfig } from "@/types/song";

const trendingKeywords = ["입례", "주의 은혜", "예배하는 자 되어", "새벽예배"];
const initialSearchWeights: SearchWeightConfig = {
  title_exact: 100,
  title_partial: 60,
  chorus_weight: 55,
  verse1_weight: 45,
  lyrics_weight: 20,
  unit_weight: 15,
  fuzzy_weight: 10
};

interface LyricsPopupState {
  key: string;
  title: string;
  text: string;
  left: number;
  top: number;
}

function getTwoLineText(result: SearchResult) {
  const firstUnit =
    Array.isArray(result.song.two_line_units) &&
    result.song.two_line_units.find((unit) => unit.trim().length > 0);

  if (firstUnit) {
    const lines = firstUnit
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length >= 2) {
      return `${lines[0]}\n${lines[1]}`;
    }
  }

  const chorus = result.song.chorus_first_line?.trim() ?? "";
  const verse = result.song.verse1_first_line?.trim() ?? "";
  if (chorus && verse) return `${chorus}\n${verse}`;
  return chorus || verse || "가사 정보가 없습니다.";
}

function getFullLyricsText(result: SearchResult) {
  const fullLyrics = result.song.lyrics_full?.trim();
  if (fullLyrics) return fullLyrics;

  const units = Array.isArray(result.song.two_line_units)
    ? result.song.two_line_units.map((unit) => unit.trim()).filter(Boolean)
    : [];
  if (units.length > 0) return units.join("\n\n");

  const chorus = result.song.chorus_first_line?.trim() ?? "";
  const verse = result.song.verse1_first_line?.trim() ?? "";
  if (chorus && verse) return `${chorus}\n${verse}`;
  return chorus || verse || "가사 정보가 없습니다.";
}

export default function HomePage() {
  const { query, setQuery, results, loading, error, searchNow } = useSongSearch({
    initialWeights: initialSearchWeights,
    includeSuggestions: false
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lyricsPopup, setLyricsPopup] = useState<LyricsPopupState | null>(null);
  const popupHideTimerRef = useRef<number | null>(null);
  const isOpen = query.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void searchNow();
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200);
    } catch {
      setCopiedKey(null);
    }
  };

  const clearPopupHideTimer = () => {
    if (popupHideTimerRef.current !== null) {
      window.clearTimeout(popupHideTimerRef.current);
      popupHideTimerRef.current = null;
    }
  };

  const schedulePopupHide = () => {
    clearPopupHideTimer();
    popupHideTimerRef.current = window.setTimeout(() => {
      setLyricsPopup(null);
    }, 70);
  };

  const openLyricsPopup = (
    event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>,
    result: SearchResult,
    rowKey: string
  ) => {
    clearPopupHideTimer();

    const anchorRect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 460;
    const viewportPadding = 12;
    const maxLeft = window.innerWidth - popupWidth - viewportPadding;
    const left = Math.max(viewportPadding, Math.min(anchorRect.left, maxLeft));

    const estimatedPopupHeight = 320;
    let top = anchorRect.bottom + 4;
    if (top + estimatedPopupHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, anchorRect.top - estimatedPopupHeight - 4);
    }

    setLyricsPopup({
      key: rowKey,
      title: result.song.title,
      text: getFullLyricsText(result),
      left,
      top
    });
  };

  useEffect(() => {
    return () => clearPopupHideTimer();
  }, []);

  return (
    <section className="relative -mx-6 flex min-h-screen flex-col overflow-hidden px-7 py-8 text-[var(--text)] md:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <svg viewBox="0 0 48 48" className="h-7 w-7 text-[var(--text-strong)]" fill="none" aria-hidden>
            <path
              d="M42.4 44S36.1 33.9 41.2 24C46.9 12.9 42.2 4 42.2 4H7s4.6 8.9-1 20c-5.1 9.9 1.3 20 1.3 20h35.1Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-lg font-medium uppercase tracking-[0.2em] text-[var(--text-soft)]">TwoLine</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm text-[var(--text-muted)] md:gap-7">
          <ThemeToggleButton />
          <Link href="/admin/song-new" className="hidden transition hover:text-[var(--primary)] sm:inline">
            Add Song
          </Link>
          <Link
            href="/admin/search-weight"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--chip-bg)] text-[var(--chip-text)] transition hover:scale-[1.03] hover:text-[var(--primary)]"
            aria-label="관리 설정"
          >
            ☰
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[980px] space-y-8 pb-24">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-strong)] md:text-6xl">예배 자막을 더 빠르게.</h1>
          </div>

          <div className="relative">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center rounded-[2px] border-2 border-[var(--border-strong)] bg-[var(--input-bg)] shadow-[var(--shadow-hard)]">
                <div className="pl-4 text-[var(--text-strong)]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <circle cx="11" cy="11" r="6" />
                    <path d="m20 20-3.6-3.6" />
                  </svg>
                </div>
                <input
                  className="w-full border-none bg-transparent px-4 py-5 text-lg font-medium text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)]"
                  placeholder="곡 제목, 가수명, 단체명 또는 가사를 입력하세요"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  aria-label="검색"
                  className="mr-2 inline-flex h-12 w-12 items-center justify-center rounded-[2px] bg-[var(--primary)] text-white transition hover:bg-[var(--primary-hover)]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                    <circle cx="11" cy="11" r="6" />
                    <path d="m20 20-3.6-3.6" />
                  </svg>
                </button>
              </div>
            </form>

            <div
              aria-hidden={!isOpen}
              className={`absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-md transition-all duration-200 ease-out ${
                isOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--text-strong)]">실시간 검색 결과 ({results.length})</p>
                {loading ? <span className="text-xs text-[var(--text-muted)]">검색 중...</span> : null}
              </div>
              {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
              {!loading && !error && results.length === 0 ? <p className="mt-3 text-sm text-[var(--text-soft)]">일치하는 곡이 없습니다.</p> : null}

              {results.length > 0 ? (
                <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {results.slice(0, 12).map((result, index) => {
                    const preview = getTwoLineText(result);
                    const fullLyrics = getFullLyricsText(result);
                    const rowKey = `${result.song.id}-${index}`;

                    return (
                      <div key={rowKey} className="rounded-xl border border-[var(--border)] bg-[var(--panel-solid)] px-3 py-3 transition-colors">
                        <div className="grid gap-3 md:grid-cols-[190px_1fr_auto] md:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-[var(--text-muted)]">{getSongMetaLabel(result.song)}</p>
                            <Link
                              href={`/song/${encodeURIComponent(result.song.id)}/`}
                              prefetch={false}
                              className="block truncate text-base font-bold text-[var(--text-strong)] hover:underline"
                            >
                              {result.song.title}
                            </Link>
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/song/${encodeURIComponent(result.song.id)}/`}
                              prefetch={false}
                              className="block whitespace-pre-line text-sm font-medium leading-relaxed text-[var(--text-soft)] transition hover:text-[var(--primary)]"
                              onMouseEnter={(event) => openLyricsPopup(event, result, rowKey)}
                              onMouseLeave={schedulePopupHide}
                              onFocus={(event) => openLyricsPopup(event, result, rowKey)}
                              onBlur={schedulePopupHide}
                            >
                              {preview}
                            </Link>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary w-full px-4 py-2 text-xs md:w-auto"
                            onClick={() => void handleCopy(rowKey, fullLyrics)}
                          >
                            {copiedKey === rowKey ? "복사됨" : "바로 복사"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {lyricsPopup ? (
            <div
              className="lyrics-popup-surface animate-lyrics-popup fixed z-40 w-[min(460px,calc(100vw-1.5rem))] rounded-2xl border p-4 backdrop-blur-xl"
              style={{ left: `${lyricsPopup.left}px`, top: `${lyricsPopup.top}px` }}
              onMouseEnter={clearPopupHideTimer}
              onMouseLeave={schedulePopupHide}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-[var(--text-strong)]">{lyricsPopup.title}</p>
                <button
                  type="button"
                  aria-label="전체 가사 복사"
                  title="전체 가사 복사"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-strong)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  onClick={() => void handleCopy(`${lyricsPopup.key}-full`, lyricsPopup.text)}
                >
                  {copiedKey === `${lyricsPopup.key}-full` ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="max-h-72 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[var(--text)]">{lyricsPopup.text}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 pt-2 text-sm">
            <span className="font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Trending:</span>
            {trendingKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => setQuery(keyword)}
                className="border-b-2 border-transparent font-bold text-[var(--text-strong)] transition hover:border-[var(--primary)]"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--header-border)] py-8">
        <div className="flex flex-col items-center justify-between gap-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] md:flex-row">
          <div className="flex items-center gap-6">
            <Link href="#" className="transition hover:text-[var(--primary)]">
              Privacy
            </Link>
            <Link href="#" className="transition hover:text-[var(--primary)]">
              Terms
            </Link>
            <Link href="#" className="transition hover:text-[var(--primary)]">
              Contact
            </Link>
          </div>
          <p>© 2026 TwoLineLyrics</p>
          <div className="flex items-center gap-2">
            <span>KO</span>
            <span className="h-2 w-2 rounded-full bg-[#20bd65]" />
            <span>Operational</span>
          </div>
        </div>
      </footer>

      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-[var(--bg-glow-a)] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-[var(--bg-glow-b)] blur-[100px]" />
    </section>
  );
}
