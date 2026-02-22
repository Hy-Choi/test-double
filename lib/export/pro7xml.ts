import { Song } from "@/types/song";

export type Pro7Background = "transparent" | "black" | "white";

export interface Pro7ExportOptions {
  includeTitleSlide: boolean;
  background: Pro7Background;
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function withBrTags(slide: string) {
  return slide
    .split("\n")
    .map((line) => escapeXml(line))
    .join("<br/>");
}

export function generateProPresenterXml(song: Song, options: Pro7ExportOptions) {
  const slides = [...song.two_line_units];
  if (options.includeTitleSlide) {
    slides.unshift(song.title);
  }

  const xmlSlides = slides
    .map(
      (slide, index) =>
        `    <Slide index="${index + 1}">\n      <Background>${options.background}</Background>\n      <Text>${withBrTags(slide)}</Text>\n    </Slide>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ProPresenterPresentation version="7">
  <Meta>
    <Title>${escapeXml(song.title)}</Title>
    <Artist>${escapeXml(song.artist ?? "")}</Artist>
    <CCLI>${escapeXml(song.ccli_number ?? "")}</CCLI>
  </Meta>
  <Slides>
${xmlSlides}
  </Slides>
</ProPresenterPresentation>
`;
}
