import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
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

export default async function SongIndexPage() {
  const songs = await readSongs();

  return (
    <section className="space-y-6">
      <header className="panel p-6">
        <h1 className="text-3xl font-black text-[#131b2e]">Songs</h1>
        <p className="mt-2 text-sm text-slate-600">곡 목록에서 선택하면 상세 페이지로 이동합니다.</p>
      </header>

      <div className="space-y-3">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/song/${encodeURIComponent(song.id)}/index`}
            className="panel block p-5 transition hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <p className="text-xl font-bold text-[#131b2e]">{song.title}</p>
            <p className="mt-1 text-sm text-slate-600">{song.artist ?? "Unknown Artist"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
