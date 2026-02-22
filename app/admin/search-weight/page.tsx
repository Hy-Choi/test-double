"use client";

import { FormEvent, useEffect, useState } from "react";
import { SearchWeightConfig } from "@/types/song";

const defaultConfig: SearchWeightConfig = {
  title_exact: 100,
  title_partial: 60,
  chorus_weight: 55,
  verse1_weight: 45,
  lyrics_weight: 20,
  unit_weight: 15,
  fuzzy_weight: 10
};

export default function SearchWeightAdminPage() {
  const [config, setConfig] = useState<SearchWeightConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/search-weight");
        const data = (await response.json()) as SearchWeightConfig & { error?: string };
        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Failed to load search weight config");
        }
        setConfig({
          title_exact: data.title_exact,
          title_partial: data.title_partial,
          chorus_weight: data.chorus_weight,
          verse1_weight: data.verse1_weight,
          lyrics_weight: data.lyrics_weight,
          unit_weight: data.unit_weight,
          fuzzy_weight: data.fuzzy_weight
        });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/search-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = (await response.json()) as SearchWeightConfig & { error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Failed to save search weights");
      }
      setMessage("Search weights updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleInput = (key: keyof SearchWeightConfig, value: string) => {
    const number = Number(value);
    setConfig((prev) => ({ ...prev, [key]: Number.isFinite(number) ? number : 0 }));
  };

  return (
    <section className="panel mx-auto max-w-3xl p-7">
      <h1 className="text-3xl font-black text-[#131b2e]">Admin: Search Weight</h1>
      <p className="mt-2 text-sm text-slate-600">검색 랭킹 점수 정책을 조정합니다.</p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading config...</p>
      ) : (
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="label">Title Exact</label>
            <input
              className="input"
              type="number"
              value={config.title_exact}
              onChange={(event) => handleInput("title_exact", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Title Partial</label>
            <input
              className="input"
              type="number"
              value={config.title_partial}
              onChange={(event) => handleInput("title_partial", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Chorus Weight</label>
            <input
              className="input"
              type="number"
              value={config.chorus_weight}
              onChange={(event) => handleInput("chorus_weight", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Verse1 Weight</label>
            <input
              className="input"
              type="number"
              value={config.verse1_weight}
              onChange={(event) => handleInput("verse1_weight", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Lyrics Weight</label>
            <input
              className="input"
              type="number"
              value={config.lyrics_weight}
              onChange={(event) => handleInput("lyrics_weight", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Unit Weight</label>
            <input
              className="input"
              type="number"
              value={config.unit_weight}
              onChange={(event) => handleInput("unit_weight", event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Fuzzy Bonus (Suggestion Only)</label>
            <input
              className="input"
              type="number"
              value={config.fuzzy_weight}
              onChange={(event) => handleInput("fuzzy_weight", event.target.value)}
            />
          </div>

          <div className="sm:col-span-2 mt-2 flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Weights"}
            </button>
            {message ? <p className="text-sm font-medium text-[#1f57d9]">{message}</p> : null}
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          </div>
        </form>
      )}
    </section>
  );
}
