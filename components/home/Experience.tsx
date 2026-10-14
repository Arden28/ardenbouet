'use client';
// Experience — an editorial timeline (period | role, company, outcomes).
import { useState } from 'react';
import { Download, MapPin } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { OWNER } from '@/lib/site';

export type ExpItem = { id: string; title: string; job: string; fromTo: string; type: string; location?: string; logline?: string; outcomes: string[]; tags: string[] };

const VISIBLE = 4;

export function Experience({ items }: { items: ExpItem[] }) {
  const { ui } = useSite();
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, VISIBLE);
  if (!items.length) return null;

  return (
    <section id="experience" aria-labelledby="exp-title" className="scroll-mt-20 border-t border-[#f2f2f2] bg-[#fafafa]">
      <div className="mx-auto grid max-w-[1192px] gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-20 lg:py-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="exp-title" className="font-story text-[40px] leading-[1.1] tracking-[-0.02em] text-[#242424] sm:text-[48px]">{ui('home.exp.title')}</h2>
          <p className="mt-3 text-[16px] leading-[26px] text-[#6b6b6b]">{ui('home.exp.sub')}</p>
          <a href={OWNER.resume} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] text-[#242424] transition-colors hover:bg-[#242424] hover:text-white">
            <Download className="h-4 w-4" /> {ui('home.exp.resume')}
          </a>
        </div>

        <ol className="relative">
          {shown.map((e, i) => (
            <li key={e.id} className={`grid gap-2 py-8 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-8 ${i ? 'border-t border-[#ececec]' : 'pt-0'}`}>
              <div className="text-[13px] text-[#6b6b6b]">
                <p className="font-medium text-[#242424]">{e.fromTo}</p>
                <p className="mt-0.5">{e.type}</p>
              </div>
              <div className="min-w-0">
                <h3 className="text-[21px] font-bold leading-7 tracking-[-0.01em] text-[#242424]">{e.job || e.title}</h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] text-[#6b6b6b]">
                  <span>{e.job ? e.title : ''}</span>
                  {e.location && <span className="flex items-center gap-1 text-[13px]"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>}
                </p>
                {e.logline && <p className="mt-3 font-story text-[18px] leading-[28px] text-[#242424]">{e.logline}</p>}
                {e.outcomes.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {e.outcomes.slice(0, 4).map((o, j) => (
                      <li key={j} className="relative pl-5 text-[15px] leading-[24px] text-[#6b6b6b] before:absolute before:left-0 before:top-[11px] before:h-px before:w-2.5 before:bg-[#9b9b9b]">{o}</li>
                    ))}
                  </ul>
                )}
                {e.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {e.tags.slice(0, 6).map(t => <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-[#6b6b6b] ring-1 ring-[#ececec]">{t}</span>)}
                  </div>
                )}
              </div>
            </li>
          ))}
          {items.length > VISIBLE && (
            <li className="border-t border-[#ececec] pt-6">
              <button type="button" onClick={() => setAll(a => !a)} className="text-[14px] font-medium text-[#242424] underline decoration-[#d4d4d4] underline-offset-4 hover:decoration-[#242424]">
                {all ? ui('home.exp.less') : ui('home.exp.more', { n: items.length - VISIBLE })}
              </button>
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}
