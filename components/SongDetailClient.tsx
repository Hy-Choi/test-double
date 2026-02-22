"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import SlideBlock from "@/components/SlideBlock";
import { renderSlideToPngBlob } from "@/lib/export/canvas";
import { downloadBlob, downloadText } from "@/lib/export/download";
import { generateProPresenterXml, Pro7Background } from "@/lib/export/pro7xml";
import { Song } from "@/types/song";

interface SongDetailClientProps {
  song: Song;
}

function makeSafeFileStem(title: string) {
  return title.replace(/[^\w\u3131-\uD79D]+/g, "_");
}

export default function SongDetailClient({ song }: SongDetailClientProps) {
  const [fontSize, setFontSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [verticalPosition, setVerticalPosition] = useState<"center" | "lower">("center");
  const [paddingPercent, setPaddingPercent] = useState(10);
  const [background, setBackground] = useState<Pro7Background>("transparent");
  const [includeTitleSlide, setIncludeTitleSlide] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  const safeTitle = useMemo(() => makeSafeFileStem(song.title), [song.title]);

  const pngOptions = {
    fontSize,
    lineHeight,
    verticalPosition,
    paddingPercent,
    background
  };

  const handleDownloadTxt = () => {
    const content = song.two_line_units.join("\n\n");
    downloadText(content, `${safeTitle}.txt`);
    setStatus("TXT downloaded.");
  };

  const handleDownloadXml = () => {
    const xml = generateProPresenterXml(song, { includeTitleSlide, background });
    downloadText(xml, `${safeTitle}_Pro7.xml`, "application/xml;charset=utf-8");
    setStatus("ProPresenter XML downloaded.");
  };

  const handleDownloadSinglePng = async (index: number) => {
    const slide = song.two_line_units[index];
    if (!slide) return;

    setBusy(`png-${index}`);
    setStatus(null);
    try {
      const blob = await renderSlideToPngBlob(slide, pngOptions);
      const fileName = `${safeTitle}_${String(index + 1).padStart(3, "0")}.png`;
      downloadBlob(blob, fileName);
      setStatus(`PNG slide ${index + 1} downloaded.`);
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadAllZip = async () => {
    setBusy("zip");
    setStatus(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < song.two_line_units.length; i += 1) {
        const slide = song.two_line_units[i];
        const blob = await renderSlideToPngBlob(slide, pngOptions);
        const fileName = `${safeTitle}_${String(i + 1).padStart(3, "0")}.png`;
        zip.file(fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${safeTitle}_slides.zip`);
      setStatus("ZIP downloaded.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        {song.two_line_units.map((slide, index) => (
          <div key={`${slide}-${index}`} className="space-y-3">
            <SlideBlock index={index} text={slide} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleDownloadSinglePng(index)}
                className="btn-secondary"
                disabled={Boolean(busy)}
              >
                {busy === `png-${index}` ? "Generating..." : `Download PNG ${String(index + 1).padStart(3, "0")}`}
              </button>
            </div>
          </div>
        ))}
      </section>

      <aside className="panel h-fit space-y-5 p-5">
        <div>
          <h3 className="text-base font-semibold text-[#131b2e]">Export</h3>
          <p className="mt-1 text-sm text-slate-600">TXT, PNG(1920x1080), ProPresenter XML</p>
        </div>

        <div className="space-y-3">
          <button type="button" className="btn-primary w-full" onClick={handleDownloadTxt}>
            Download TXT
          </button>
          <button type="button" className="btn-primary w-full" onClick={handleDownloadXml}>
            Export ProPresenter XML
          </button>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy === "zip"}
            onClick={handleDownloadAllZip}
          >
            {busy === "zip" ? "Generating ZIP..." : "Download All PNG as ZIP"}
          </button>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-warmGray">PNG Options</h4>

          <div>
            <label className="label">Font Size (24-120)</label>
            <input
              className="input"
              type="number"
              min={24}
              max={120}
              value={fontSize}
              onChange={(event) => setFontSize(Math.min(120, Math.max(24, Number(event.target.value))))}
            />
          </div>

          <div>
            <label className="label">Line Height (1.2-2.0)</label>
            <input
              className="input"
              type="number"
              step={0.1}
              min={1.2}
              max={2}
              value={lineHeight}
              onChange={(event) =>
                setLineHeight(Math.min(2, Math.max(1.2, Number(event.target.value) || 1.4)))
              }
            />
          </div>

          <div>
            <label className="label">Vertical Position</label>
            <select
              className="input"
              value={verticalPosition}
              onChange={(event) => setVerticalPosition(event.target.value as "center" | "lower")}
            >
              <option value="center">Center</option>
              <option value="lower">Lower</option>
            </select>
          </div>

          <div>
            <label className="label">Padding (5%-20%)</label>
            <input
              className="input"
              type="number"
              min={5}
              max={20}
              value={paddingPercent}
              onChange={(event) => setPaddingPercent(Math.min(20, Math.max(5, Number(event.target.value))))}
            />
          </div>

          <div>
            <label className="label">Background (PNG/XML)</label>
            <select
              className="input"
              value={background}
              onChange={(event) => setBackground(event.target.value as Pro7Background)}
            >
              <option value="transparent">Transparent</option>
              <option value="black">Black</option>
              <option value="white">White</option>
            </select>
          </div>

          <div>
            <label className="label">Single PNG from Slide</label>
            <select
              className="input"
              value={selectedSlideIndex}
              onChange={(event) => setSelectedSlideIndex(Number(event.target.value))}
            >
              {song.two_line_units.map((_, index) => (
                <option key={index} value={index}>
                  {String(index + 1).padStart(3, "0")}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary mt-2 w-full"
              onClick={() => handleDownloadSinglePng(selectedSlideIndex)}
              disabled={Boolean(busy)}
            >
              Download Selected PNG
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeTitleSlide}
              onChange={(event) => setIncludeTitleSlide(event.target.checked)}
            />
            Include title slide in XML
          </label>
        </div>

        {status ? <p className="text-sm font-medium text-[#1f57d9]">{status}</p> : null}
      </aside>
    </div>
  );
}
