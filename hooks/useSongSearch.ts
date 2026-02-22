"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { buildSuggestions, rankSongs } from "@/lib/search-ranking";
import { SearchResult, SearchSuggestion, SearchWeightConfig, Song } from "@/types/song";

interface SearchApiResponse {
  query: string;
  weights: SearchWeightConfig;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  error?: string;
}

interface UseSongSearchOptions {
  initialWeights: SearchWeightConfig;
  debounceMs?: number;
  cacheTtlMs?: number;
  includeSuggestions?: boolean;
}

interface UseSongSearchResult {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  weights: SearchWeightConfig;
  loading: boolean;
  error: string | null;
  searchNow: () => Promise<void>;
}

interface CachedSearchData {
  expiresAt: number;
  fetchedAt: number;
  payload: SearchApiResponse;
}

const defaultDebounceMs = 120;
const requestDedupWindowMs = 350;
const defaultCacheTtlMs = 20_000;
const staleCacheMaxAgeMs = 120_000;
const queryCache = new Map<string, CachedSearchData>();

let songsCache: Song[] | null = null;
let songsPromise: Promise<Song[]> | null = null;

function normalizeCacheKey(query: string, includeSuggestions: boolean) {
  const normalized = query.trim().normalize("NFC").toLowerCase();
  return `${includeSuggestions ? "1" : "0"}:${normalized}`;
}

function purgeExpiredCacheEntries(now: number) {
  for (const [key, value] of queryCache.entries()) {
    if (value.fetchedAt + staleCacheMaxAgeMs <= now) {
      queryCache.delete(key);
    }
  }

  const maxCacheEntries = 120;
  while (queryCache.size > maxCacheEntries) {
    const oldestKey = queryCache.keys().next().value;
    if (!oldestKey) break;
    queryCache.delete(oldestKey);
  }
}

async function loadSongs() {
  if (songsCache) {
    return songsCache;
  }

  if (songsPromise) {
    return songsPromise;
  }

  songsPromise = (async () => {
    const response = await fetch("/data/songs.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Failed to load songs.json (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("Invalid songs.json format: expected an array");
    }

    songsCache = payload as Song[];
    return songsCache;
  })();

  try {
    return await songsPromise;
  } finally {
    songsPromise = null;
  }
}

export function useSongSearch(options: UseSongSearchOptions): UseSongSearchResult {
  const debounceMs = options.debounceMs ?? defaultDebounceMs;
  const cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs;
  const includeSuggestions = options.includeSuggestions ?? false;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [weights, setWeights] = useState<SearchWeightConfig>(options.initialWeights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const lastFetchedAtRef = useRef<Map<string, number>>(new Map());

  const resetStateForEmptyQuery = useCallback(() => {
    requestSeqRef.current += 1;
    inFlightKeyRef.current = null;
    setResults([]);
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  const applyPayload = useCallback(
    (payload: SearchApiResponse) => {
      setResults(payload.results ?? []);
      setSuggestions(payload.suggestions ?? []);
      setWeights(payload.weights ?? options.initialWeights);
      setError(null);
    },
    [options.initialWeights]
  );

  const fetchSearch = useCallback(
    async (trimmed: string, key: string, silent: boolean) => {
      if (inFlightKeyRef.current === key) return;

      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      inFlightKeyRef.current = key;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const songs = await loadSongs();

        if (requestSeq !== requestSeqRef.current) return;

        const nextWeights = options.initialWeights;
        const nextResults = rankSongs(songs, trimmed, nextWeights).slice(0, 50);
        const nextSuggestions = includeSuggestions
          ? buildSuggestions(songs, trimmed, nextWeights, 8)
          : [];

        const payload: SearchApiResponse = {
          query: trimmed,
          weights: nextWeights,
          results: nextResults,
          suggestions: nextSuggestions
        };

        applyPayload(payload);
        const fetchedAt = Date.now();
        queryCache.set(key, {
          expiresAt: fetchedAt + cacheTtlMs,
          fetchedAt,
          payload
        });
        lastFetchedAtRef.current.set(key, fetchedAt);
      } catch (requestError) {
        if (requestSeq !== requestSeqRef.current) return;

        if (!silent) {
          setResults([]);
          setSuggestions([]);
          setError(requestError instanceof Error ? requestError.message : "Unknown error");
        }
      } finally {
        if (requestSeq === requestSeqRef.current && !silent) {
          setLoading(false);
        }

        if (inFlightKeyRef.current === key) {
          inFlightKeyRef.current = null;
        }
      }
    },
    [applyPayload, cacheTtlMs, includeSuggestions, options.initialWeights]
  );

  const runSearch = useCallback(
    async (rawQuery: string, useCache: boolean) => {
      const trimmed = rawQuery.trim();
      if (!trimmed) {
        resetStateForEmptyQuery();
        return;
      }

      const key = normalizeCacheKey(trimmed, includeSuggestions);
      const now = Date.now();
      purgeExpiredCacheEntries(now);
      const cached = queryCache.get(key);

      if (useCache && cached) {
        applyPayload(cached.payload);
        setLoading(false);
      }

      const hasFreshCache = Boolean(cached && cached.expiresAt > now);
      const lastFetchedAt = lastFetchedAtRef.current.get(key) ?? cached?.fetchedAt ?? 0;

      if (useCache && hasFreshCache) {
        if (now - lastFetchedAt > requestDedupWindowMs && inFlightKeyRef.current !== key) {
          void fetchSearch(trimmed, key, true);
        }
        return;
      }

      if (useCache && inFlightKeyRef.current === key) {
        return;
      }

      if (useCache && now - lastFetchedAt <= requestDedupWindowMs) {
        return;
      }

      await fetchSearch(trimmed, key, useCache && Boolean(cached));
    },
    [applyPayload, fetchSearch, includeSuggestions, resetStateForEmptyQuery]
  );

  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!query.trim()) {
      resetStateForEmptyQuery();
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void runSearch(query, true);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [debounceMs, query, resetStateForEmptyQuery, runSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const searchNow = useCallback(async () => {
    await runSearch(query, true);
  }, [query, runSearch]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    weights,
    loading,
    error,
    searchNow
  };
}
