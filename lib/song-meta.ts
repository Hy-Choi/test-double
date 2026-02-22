import { Song } from "@/types/song";

function cleanValue(value: string | null | undefined) {
  if (!value) return "";
  return value.trim();
}

export function getSongMetaLabel(song: Song): string {
  const artist = cleanValue(song.artist);
  const ccliNumber = cleanValue(song.ccli_number);
  const copyrightHolder = cleanValue(song.copyright_holder);

  const parts: string[] = [];

  if (artist) {
    parts.push(artist);
  }

  if (ccliNumber) {
    parts.push(`CCLI ${ccliNumber}`);
  }

  if (copyrightHolder) {
    parts.push(copyrightHolder);
  }

  if (parts.length === 0) {
    return "Unknown Artist";
  }

  return parts.join(" · ");
}
