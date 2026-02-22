export type VerticalPosition = "center" | "lower";
export type CanvasBackground = "transparent" | "black" | "white";

export interface CanvasSlideOptions {
  fontSize: number;
  lineHeight: number;
  verticalPosition: VerticalPosition;
  paddingPercent: number;
  background: CanvasBackground;
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: CanvasSlideOptions = {
  fontSize: 64,
  lineHeight: 1.4,
  verticalPosition: "center",
  paddingPercent: 10,
  background: "transparent",
  width: 1920,
  height: 1080
};

function getTextColor(background: CanvasBackground) {
  return background === "black" ? "#ffffff" : "#111827";
}

function applyBackground(ctx: CanvasRenderingContext2D, width: number, height: number, bg: CanvasBackground) {
  if (bg === "transparent") {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = bg === "black" ? "#000000" : "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  targetSize: number,
  maxWidth: number
) {
  let size = targetSize;
  while (size > 16) {
    ctx.font = `700 ${size}px "Pretendard", "Noto Sans KR", sans-serif`;
    const tooWide = lines.some((line) => ctx.measureText(line).width > maxWidth);
    if (!tooWide) break;
    size -= 2;
  }
  return size;
}

export async function renderSlideToPngBlob(
  text: string,
  customOptions: Partial<CanvasSlideOptions> = {}
): Promise<Blob> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;
  const lines = text.split("\n").map((line) => line.trim());

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to initialize canvas context.");
  }

  applyBackground(ctx, width, height, options.background);

  const horizontalPadding = width * (options.paddingPercent / 100);
  const maxTextWidth = width - horizontalPadding * 2;
  const fittedFontSize = fitFontSize(ctx, lines, options.fontSize, maxTextWidth);
  const pixelLineHeight = fittedFontSize * options.lineHeight;
  const blockHeight = fittedFontSize + (lines.length - 1) * pixelLineHeight;

  const anchorY = options.verticalPosition === "center" ? height / 2 : height * 0.72;
  const firstLineY = anchorY - blockHeight / 2 + fittedFontSize / 2;

  ctx.fillStyle = getTextColor(options.background);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fittedFontSize}px "Pretendard", "Noto Sans KR", sans-serif`;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, firstLineY + index * pixelLineHeight, maxTextWidth);
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  if (!blob) {
    throw new Error("Canvas export failed.");
  }

  return blob;
}
