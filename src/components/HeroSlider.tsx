import { useEffect, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  alt?: string;
};

export function HeroSlider({ images, intervalMs = 4500, alt = "" }: Props) {
  const [idx, setIdx] = useState(0);
  const list = images.filter(Boolean);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), Math.max(1500, intervalMs));
    return () => clearInterval(t);
  }, [list.length, intervalMs]);

  if (list.length === 0) return null;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-glow">
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {list.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={alt}
            className="h-full w-full flex-shrink-0 object-cover"
            draggable={false}
          />
        ))}
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slajd ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
