'use client';
// "Selected work" — filterable project cards in the Medium visual language.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';

export type WorkItem = {
  id: string; title: string; description: string; logoUrl: string; url: string; tags: string[]; tech: string[];
  metric?: string; cover?: string; hasCase: boolean;
};

export function Work({ items, tagLabels }: { items: WorkItem[]; tagLabels: Record<string, string> }) {
  const { ui, href } = useSite();
  const [filter, setFilter] = useState<string>('all');
  const tags = useMemo(() => Array.from(new Set(items.flatMap(i => i.tags))).filter(t => tagLabels[t]), [items, tagLabels]);
  const shown = filter === 'all' ? items : items.filter(i => i.tags.includes(filter));

  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-20 border-t border-[#f2f2f2]">
      <div className="mx-auto max-w-[1192px] px-6 py-16 lg:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="work-title" className="font-story text-[40px] leading-[1.1] tracking-[-0.02em] text-[#242424] sm:text-[48px]">{ui('home.work.title')}</h2>
            <p className="mt-3 max-w-[520px] text-[16px] leading-[26px] text-[#6b6b6b]">{ui('home.work.sub')}</p>
          </div>
          <nav className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:px-0" aria-label="Filter projects">
            {['all', ...tags].map(tg => (
              <button key={tg} type="button" onClick={() => setFilter(tg)}
                className={`shrink-0 rounded-full px-4 py-2 text-[14px] transition-colors ${filter === tg ? 'bg-[#242424] text-white' : 'bg-[#f2f2f2] text-[#242424] hover:bg-[#e6e6e6]'}`}>
                {tg === 'all' ? ui('home.work.all') : tagLabels[tg]}
              </button>
            ))}
          </nav>
        </div>

        {shown.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{ui('home.work.empty')}</p>
        ) : (
          <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
            {shown.map((p, i) => (
              <article key={p.id} className={`group flex flex-col ${i === 0 && shown.length > 2 ? 'md:col-span-2 md:grid md:grid-cols-[1.25fr_1fr] md:items-center md:gap-10' : ''}`}>
                <Link href={href(`/projects/${p.id}`)} className="block overflow-hidden rounded-2xl bg-[#f6f6f6]" tabIndex={-1} aria-hidden>
                  {p.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover} alt="" loading={i < 2 ? 'eager' : 'lazy'} className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-16 w-16 object-contain opacity-80" /> : <span className="font-story text-[48px] text-[#c4c4c4]">{p.title[0]}</span>}
                    </div>
                  )}
                </Link>
                <div className={i === 0 && shown.length > 2 ? 'mt-6 md:mt-0' : 'mt-6'}>
                  <div className="flex items-center gap-3">
                    {p.logoUrl && p.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="h-7 w-7 rounded-md object-contain" />
                    )}
                    <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{p.tags.map(tg => tagLabels[tg]).filter(Boolean).join(' · ')}</p>
                  </div>
                  <h3 className={`mt-3 font-bold tracking-[-0.016em] text-[#242424] ${i === 0 && shown.length > 2 ? 'text-[30px] leading-[36px]' : 'text-[24px] leading-[30px]'}`}>
                    <Link href={href(`/projects/${p.id}`)} className="hover:underline hover:decoration-[#d4d4d4] hover:underline-offset-4">{p.title}</Link>
                  </h3>
                  <p className="mt-2 font-story text-[18px] leading-[28px] text-[#6b6b6b] line-clamp-3">{p.description}</p>
                  {p.metric && <p className="mt-3 text-[14px] font-medium text-[#1a6b17]">{p.metric}</p>}
                  {p.tech.length > 0 && <p className="mt-3 text-[13px] text-[#9b9b9b]">{p.tech.slice(0, 5).join(' · ')}</p>}
                  <div className="mt-5 flex items-center gap-5 text-[14px]">
                    <Link href={href(`/projects/${p.id}`)} className="font-medium text-[#242424] underline decoration-[#d4d4d4] underline-offset-4 hover:decoration-[#242424]">{ui('home.work.caseStudy')}</Link>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#6b6b6b] hover:text-[#242424]">{ui('home.work.visit')} <ArrowUpRight className="h-3.5 w-3.5" /></a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
