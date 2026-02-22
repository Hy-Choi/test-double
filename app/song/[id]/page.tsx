import { promises as fs } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import SongDetailClient from "@/components/SongDetailClient";
import { Song } from "@/types/song";

const songsFilePath = path.join(process.cwd(), "public", "data", "songs.json");

async function readSongs(): Promise<Song[]> {
  const raw = await fs.readFile(songsFilePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid songs.json format: expected an array");
  }

  return parsed as Song[];
}

interface SongDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const songs = await readSongs();
  return songs.map((song) => ({ id: song.id }));
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { id } = await params;
  const songs = await readSongs();
  const song = songs.find((item) => item.id === id);

  if (!song) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="panel p-6">
        <h1 className="text-3xl font-black text-[#131b2e]">{song.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{song.artist ?? "Unknown Artist"}</p>
      </header>
      <SongDetailClient song={song} />
    </section>
  );
}
