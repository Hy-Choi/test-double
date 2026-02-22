#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const lyricsDir = path.join(rootDir, "data", "lyrics");
const outputFile = path.join(rootDir, "public", "data", "songs.json");

function buildSongId(seed, usedIds) {
  const base = `song${createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  while (usedIds.has(`${base}${suffix}`)) {
    suffix += 1;
  }

  const id = `${base}${suffix}`;
  usedIds.add(id);
  return id;
}

function splitArtistAndTitle(fileName) {
  const baseName = fileName.replace(/\.txt$/i, "");
  const separatorIndex = baseName.indexOf("_");
  if (separatorIndex <= 0 || separatorIndex === baseName.length - 1) {
    throw new Error(
      `Invalid filename "${fileName}". Expected format: artist_title.txt`
    );
  }

  const artist = baseName.slice(0, separatorIndex).trim();
  const title = baseName.slice(separatorIndex + 1).trim();
  const normalizedArtist = artist.normalize("NFC");
  const normalizedTitle = title.normalize("NFC");

  if (!normalizedArtist || !normalizedTitle) {
    throw new Error(
      `Invalid filename "${fileName}". Artist and title must be non-empty.`
    );
  }

  return { artist: normalizedArtist, title: normalizedTitle };
}

function parseSlides(content, fileName) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    throw new Error(`"${fileName}" is empty.`);
  }

  const rawSlides = normalized
    .split(/\n\s*\n+/)
    .map((slide) => slide.trim())
    .filter(Boolean);

  if (rawSlides.length === 0) {
    throw new Error(`"${fileName}" has no slides.`);
  }

  return rawSlides.map((rawSlide, index) => {
    const lines = rawSlide
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error(`"${fileName}" slide ${index + 1} is empty.`);
    }

    if (lines.length > 2) {
      throw new Error(
        `"${fileName}" slide ${index + 1} has ${lines.length} lines. Maximum is 2.`
      );
    }

    return lines.join("\n");
  });
}

function getFirstLines(slides) {
  const lines = slides.flatMap((slide) =>
    slide
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );

  const chorusFirstLine = lines[0] ?? "";
  const verse1FirstLine = lines[1] ?? chorusFirstLine;

  return { chorusFirstLine, verse1FirstLine };
}

async function readLyricsFiles() {
  let fileNames;
  try {
    fileNames = await fs.readdir(lyricsDir);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`Lyrics directory not found: ${lyricsDir}`);
    }
    throw error;
  }

  const txtFiles = fileNames.filter((name) => name.toLowerCase().endsWith(".txt")).sort();
  if (txtFiles.length === 0) {
    throw new Error(`No .txt files found in ${lyricsDir}`);
  }

  return txtFiles;
}

async function main() {
  const txtFiles = await readLyricsFiles();
  const createdAt = new Date().toISOString();
  const usedIds = new Set();
  const songs = [];

  for (const fileName of txtFiles) {
    const filePath = path.join(lyricsDir, fileName);
    const content = await fs.readFile(filePath, "utf8");
    const { artist, title } = splitArtistAndTitle(fileName);
    const slides = parseSlides(content, fileName);
    const { chorusFirstLine, verse1FirstLine } = getFirstLines(slides);

    const songId = buildSongId(`${artist}\u0000${title}`, usedIds);

    songs.push({
      id: songId,
      title,
      artist,
      chorus_first_line: chorusFirstLine,
      verse1_first_line: verse1FirstLine,
      two_line_units: slides,
      lyrics_full: slides.join("\n\n"),
      copyright_holder: null,
      ccli_number: null,
      tags: null,
      created_at: createdAt
    });
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(songs, null, 2)}\n`, "utf8");

  console.log(`Generated ${songs.length} songs -> ${path.relative(rootDir, outputFile)}`);
}

main().catch((error) => {
  console.error("[songs:sync] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
