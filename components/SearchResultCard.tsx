import Link from "next/link";
import { SearchResult } from "@/types/song";

interface SearchResultCardProps {
  result: SearchResult;
}

export default function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#131b2e]">
            <Link href={`/song/${result.song.id}`} className="hover:underline">
              {result.song.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-slate-500">{result.song.artist ?? "Unknown Artist"}</p>
        </div>
        <span className="rounded-full bg-[#1f57d9]/10 px-3 py-1 text-sm font-semibold text-[#1f57d9]">
          Score {result.score}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Chorus:</span> {result.song.chorus_first_line}
        </p>
        <p>
          <span className="font-semibold">Verse 1:</span> {result.song.verse1_first_line}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {result.matched_fields.map((field) => (
          <span key={field} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {field}
          </span>
        ))}
      </div>
    </article>
  );
}
