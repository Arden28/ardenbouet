// A series cover drawn as a small stack of pages, so a series reads as "several stories" at a glance.
export function SeriesCover({ src, title, count, badge, className = '' }: { src: string | null; title: string; count: number; badge?: string; className?: string }) {
  const layers = Math.min(Math.max(count - 1, 0), 2);
  return (
    <div className={`relative ${className}`}>
      {layers >= 2 && <span aria-hidden className="absolute inset-x-6 -top-3 bottom-3 rounded-2xl bg-[#ececec] transition-transform duration-500 group-hover:-translate-y-1" />}
      {layers >= 1 && <span aria-hidden className="absolute inset-x-3 -top-1.5 bottom-1.5 rounded-2xl bg-[#e6e6e6] transition-transform duration-500 group-hover:-translate-y-0.5" />}
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#f2f2f2] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-end bg-[#f4f4f4] p-6">
            <span className="font-story text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#c4c4c4] line-clamp-3">{title}</span>
          </div>
        )}
        {badge && <span className="absolute left-3 top-3 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[12px] font-medium text-[#141414] shadow-sm">{badge}</span>}
      </div>
    </div>
  );
}
