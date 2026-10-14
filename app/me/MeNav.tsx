'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bookmark, FileText, Feather, Wallet, Settings } from 'lucide-react';
import { splitLocale } from '@/lib/i18n/config';
import { useSite } from '@/components/site/SiteProviders';
import { Avatar } from '@/components/site/SiteHeader';

export function MeNav() {
  const { ui, href, me } = useSite();
  const path = splitLocale(usePathname() || '/').path;
  const isWriter = !!me?.writer.isWriter;
  const items = [
    { href: '/me', label: ui('me.profile'), icon: User, exact: true },
    { href: '/me/library', label: ui('me.library'), icon: Bookmark },
    ...(isWriter
      ? [{ href: '/me/stories', label: ui('me.stories'), icon: FileText }, { href: '/me/earnings', label: ui('me.earnings'), icon: Wallet }]
      : [{ href: '/me/writer', label: ui('me.writer'), icon: Feather }]),
    { href: '/me/settings', label: ui('me.settings'), icon: Settings },
  ];

  return (
    <aside className="lg:w-[240px] lg:shrink-0">
      {me && (
        <div className="mb-6 hidden items-center gap-3 lg:flex">
          <Avatar name={me.reader.name} image={me.reader.image} size={48} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-[#242424]">{me.reader.name}</p>
            {me.reader.handle && <p className="truncate text-[13px] text-[#6b6b6b]">@{me.reader.handle}</p>}
          </div>
        </div>
      )}
      <nav className="no-scrollbar -mx-6 flex gap-1 overflow-x-auto border-b border-[#f2f2f2] px-6 lg:mx-0 lg:flex-col lg:border-0 lg:px-0">
        {items.map(it => {
          const active = it.exact ? path === it.href : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={href(it.href)}
              className={`flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-[14px] transition-colors lg:rounded-md lg:border-0 lg:px-3 lg:py-2.5 ${
                active ? 'border-[#242424] text-[#242424] lg:bg-[#f6f6f6]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424] lg:hover:bg-[#fafafa]'
              }`}
            >
              <it.icon className="hidden h-[18px] w-[18px] lg:block" strokeWidth={1.5} /> {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
