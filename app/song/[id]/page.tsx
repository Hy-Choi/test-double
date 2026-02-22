import { notFound } from "next/navigation";
import SongDetailClient from "@/components/SongDetailClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Song } from "@/types/song";

interface SongDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("songs").select("*").eq("id", id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="panel p-6">
        <h1 className="text-3xl font-black text-[#131b2e]">{data.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{data.artist ?? "Unknown Artist"}</p>
      </header>
      <SongDetailClient song={data as Song} />
    </section>
  );
}
