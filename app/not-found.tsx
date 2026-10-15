// 404 — rendered for unknown routes and every notFound() call.
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import { getLocale, lhref } from '@/lib/i18n/server';
import { uiT } from '@/lib/i18n/ui';
import { ErrorScreen, errBtnPrimary } from '@/components/site/ErrorScreen';

export const metadata: Metadata = { title: 'Page not found · Arden BOUET', robots: { index: false } };

export default function NotFound() {
  const ui = uiT(getLocale());
  const links = [
    { href: lhref('/'), label: 'ardenbouet.me' },
    { href: lhref('/blog'), label: ui('nav.writing') },
    { href: lhref('/#work'), label: ui('nav.work') },
    { href: lhref('/shop'), label: ui('nav.shop') },
  ];
  return (
    <ErrorScreen
      code={404}
      eyebrow={ui('err.code', { code: 404 })}
      title={ui('err.404.title')}
      body={ui('err.404.body')}
      actions={<Link href={lhref('/')} className={errBtnPrimary}><ArrowLeft className="h-4 w-4" /> {ui('err.home')}</Link>}
    >
      <form action={lhref('/blog')} className="mt-8 flex max-w-[440px] items-center gap-3 rounded-full border border-[#e6e6e6] bg-white px-4 py-2.5 focus-within:border-[#242424]">
        <Search className="h-4 w-4 shrink-0 text-[#9b9b9b]" />
        <input name="q" placeholder={ui('err.search')} aria-label={ui('err.search')} className="min-w-0 flex-1 bg-transparent text-[15px] text-[#242424] outline-none placeholder:text-[#9b9b9b]" />
      </form>
      <p className="mt-10 text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('err.links')}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="group inline-flex items-center gap-1 rounded-full bg-[#f2f2f2] px-3.5 py-1.5 text-[14px] text-[#242424] transition-colors hover:bg-[#e6e6e6]">
              {l.label} <ArrowUpRight className="h-3.5 w-3.5 text-[#9b9b9b] transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
            </Link>
          </li>
        ))}
      </ul>
    </ErrorScreen>
  );
}
