"use client";

import { FormEvent, useMemo, useState } from "react";

interface PreviewState {
  units: string[];
  warnings: string[];
  errors: string[];
}

interface SongFormState {
  title: string;
  artist: string;
  chorus_first_line: string;
  verse1_first_line: string;
  two_line_units_raw: string;
  copyright_holder: string;
  ccli_number: string;
  tags_raw: string;
}

const initialForm: SongFormState = {
  title: "",
  artist: "",
  chorus_first_line: "",
  verse1_first_line: "",
  two_line_units_raw: "",
  copyright_holder: "",
  ccli_number: "",
  tags_raw: ""
};

function parseTwoLineUnits(raw: string): PreviewState {
  const warnings: string[] = [];
  const errors: string[] = [];
  const chunks = raw
    .trim()
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    errors.push("two_line_units is required. Separate slides by blank lines.");
    return { units: [], warnings, errors };
  }

  const units = chunks.map((chunk, index) => {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 1) {
      warnings.push(`Slide ${index + 1}: 1 line detected (allowed, but 2 lines recommended).`);
    }

    if (lines.length >= 3) {
      errors.push(`Slide ${index + 1}: 3+ lines are not allowed.`);
    }

    if (lines.length === 0) {
      errors.push(`Slide ${index + 1}: empty slide is not allowed.`);
    }

    return lines.join("\n");
  });

  return { units, warnings, errors };
}

function buildLyricsFull(units: string[]) {
  return units.join("\n\n");
}

export default function SongNewAdminPage() {
  const [form, setForm] = useState<SongFormState>(initialForm);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiredFieldErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push("title is required");
    if (!form.chorus_first_line.trim()) errors.push("chorus_first_line is required");
    if (!form.verse1_first_line.trim()) errors.push("verse1_first_line is required");
    if (!form.two_line_units_raw.trim()) errors.push("two_line_units is required");
    return errors;
  }, [form]);

  const canSave =
    requiredFieldErrors.length === 0 && Boolean(preview) && (preview?.errors.length ?? 1) === 0 && !saving;

  const handlePreview = () => {
    const nextPreview = parseTwoLineUnits(form.two_line_units_raw);
    setPreview(nextPreview);
    setStatus(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!preview) {
      setError("Please generate preview first.");
      return;
    }
    if (preview.errors.length > 0) {
      setError("Fix preview errors before save.");
      return;
    }

    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const tags = form.tags_raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        artist: form.artist.trim() || null,
        chorus_first_line: form.chorus_first_line.trim(),
        verse1_first_line: form.verse1_first_line.trim(),
        two_line_units: preview.units,
        lyrics_full: buildLyricsFull(preview.units),
        copyright_holder: form.copyright_holder.trim() || null,
        ccli_number: form.ccli_number.trim() || null,
        tags: tags.length ? tags : null
      };

      let response: Response;
      try {
        response = await fetch("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {
        throw new Error("API request failed. Ensure dev server is running and restart `npm run dev`.");
      }

      const raw = await response.text();
      let data: { id?: string; error?: string; hint?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { id?: string; error?: string; hint?: string };
        } catch {
          if (!response.ok) {
            throw new Error(`Server error (${response.status}): ${raw.slice(0, 200)}`);
          }
        }
      }

      if (!response.ok || data.error) {
        const detail = [data.error, data.hint].filter(Boolean).join(" - ");
        throw new Error(detail || `Failed to create song (${response.status})`);
      }

      setStatus(`Song saved. ID: ${data.id ?? "created"}`);
      setForm(initialForm);
      setPreview(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="panel p-7">
        <h1 className="text-3xl font-black text-[#131b2e]">Admin: Register Song</h1>
        <p className="mt-2 text-sm text-slate-600">
          Slides must be separated by a blank line. 1 line is allowed with warning, 3+ lines are rejected.
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
        <section className="panel space-y-4 p-6">
          <div>
            <label className="label">Title (required)</label>
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>

          <div>
            <label className="label">Artist</label>
            <input
              className="input"
              value={form.artist}
              onChange={(event) => setForm((prev) => ({ ...prev, artist: event.target.value }))}
            />
          </div>

          <div>
            <label className="label">Chorus First Line (required)</label>
            <input
              className="input"
              value={form.chorus_first_line}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chorus_first_line: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">Verse1 First Line (required)</label>
            <input
              className="input"
              value={form.verse1_first_line}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, verse1_first_line: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">Two Line Units (required)</label>
            <textarea
              className="input min-h-[220px] whitespace-pre-wrap"
              value={form.two_line_units_raw}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, two_line_units_raw: event.target.value }))
              }
              placeholder={`주님 다시 오실 때까지\n나는 이 길을 가리라\n\n주의 은혜로 나아가네\n오늘도 승리하리`}
            />
            <p className="mt-2 text-xs text-slate-500">Blank line = new slide</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Copyright Holder</label>
              <input
                className="input"
                value={form.copyright_holder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, copyright_holder: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">CCLI Number</label>
              <input
                className="input"
                value={form.ccli_number}
                onChange={(event) => setForm((prev) => ({ ...prev, ccli_number: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input
              className="input"
              value={form.tags_raw}
              onChange={(event) => setForm((prev) => ({ ...prev, tags_raw: event.target.value }))}
              placeholder="예배, 주일, 은혜"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={handlePreview}>
              Preview
            </button>
            <button type="submit" className="btn-primary" disabled={!canSave}>
              {saving ? "Saving..." : "Save Song"}
            </button>
          </div>

          {requiredFieldErrors.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {requiredFieldErrors.map((item) => (
                <p key={item}>- {item}</p>
              ))}
            </div>
          ) : null}
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {status ? <p className="text-sm font-medium text-[#1f57d9]">{status}</p> : null}
        </section>

        <aside className="panel h-fit space-y-4 p-5">
          <h2 className="text-base font-semibold text-[#131b2e]">Preview</h2>

          {!preview ? (
            <p className="text-sm text-slate-500">Preview를 눌러 슬라이드를 확인하세요.</p>
          ) : (
            <>
              <p className="text-sm text-slate-700">Slides: {preview.units.length}</p>

              {preview.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {preview.warnings.map((warning) => (
                    <p key={warning}>- {warning}</p>
                  ))}
                </div>
              ) : null}

              {preview.errors.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {preview.errors.map((previewError) => (
                    <p key={previewError}>- {previewError}</p>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {preview.units.map((unit, index) => (
                    <article key={`${unit}-${index}`} className="rounded-lg border border-slate-200 p-3">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Slide {String(index + 1).padStart(3, "0")}
                      </p>
                      <p className="whitespace-pre-line text-sm font-semibold text-[#131b2e]">{unit}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </form>
    </section>
  );
}
