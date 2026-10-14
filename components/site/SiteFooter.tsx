'use client';
// Site-wide footer in the Medium visual language.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { splitLocale } from '@/lib/i18n/config';
import { OWNER, PROFILES } from '@/lib/site';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { GitHubMark, LinkedInMark, UpworkMark } from './BrandIcons';
import { hideChrome } from './SiteHeader';
import { useSite } from './SiteProviders';

export function SiteFooter() {
  const { ui, href } = useSite();
  const path = splitLocale(usePathname() || '/').path;
  if (hideChrome(path)) return null;

  const col = 'text-[14px] text-[#6b6b6b] hover:text-[#242424] transition-colors';
  return (
    <footer className="blog-ui mt-24 border-t border-[#f2f2f2] bg-white">
      <div className="mx-auto grid max-w-[1192px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href={href('/')} className="font-story text-[26px] font-bold tracking-[-0.02em] text-[#242424]">Arden</Link>
          <p className="mt-3 max-w-[320px] text-[14px] leading-[22px] text-[#6b6b6b]">{ui('footer.tagline')}</p>
          <div className="mt-6 flex gap-2">
            {[
              { href: PROFILES.github, label: 'GitHub', Icon: GitHubMark },
              { href: PROFILES.linkedin, label: 'LinkedIn', Icon: LinkedInMark },
              { href: PROFILES.upwork, label: 'Upwork', Icon: UpworkMark },
            ].map(({ href: h, label, Icon }) => (
              <a key={label} href={h} target="_blank" rel="noopener noreferrer me" aria-label={label} title={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6e6] text-[#242424] transition-colors hover:border-[#242424]">
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">{ui('footer.site')}</p>
          <ul className="space-y-2.5">
            <li><Link href={href('/#work')} className={col}>{ui('nav.work')}</Link></li>
            <li><Link href={href('/blog')} className={col}>{ui('nav.writing')}</Link></li>
            <li><Link href={href('/shop')} className={col}>{ui('nav.shop')}</Link></li>
            <li><Link href={href('/book')} className={col}>{ui('nav.book')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">{ui('footer.elsewhere')}</p>
          <ul className="space-y-2.5">
            <li><Link href={href('/blog/subscribe')} className={col}>{ui('footer.newsletter')}</Link></li>
            <li><a href="/blog/rss.xml" className={col}>{ui('footer.rss')}</a></li>
            <li><a href={OWNER.resume} target="_blank" rel="noopener noreferrer" className={col}>{ui('footer.resume')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#f2f2f2]">
        <div className="mx-auto flex max-w-[1192px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-[13px] text-[#9b9b9b]">
          <span>© {new Date().getFullYear()} {OWNER.name}. {ui('footer.rights')}</span>
          <LanguageSwitcher variant="inline" />
        </div>
      </div>
    </footer>
  );
}
