interface SlideBlockProps {
  index: number;
  text: string;
}

export default function SlideBlock({ index, text }: SlideBlockProps) {
  return (
    <article className="panel p-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-warmGray">
          Slide {String(index + 1).padStart(3, "0")}
        </h4>
      </div>
      <p className="whitespace-pre-line text-center text-2xl font-bold leading-relaxed text-[#131b2e]">
        {text}
      </p>
    </article>
  );
}
