'use client';
// Medium-style top bar for every /blog page.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Bookmark, PenSquare, Search, Bell, ChevronDown, LogOut, Home } from 'lucide-react';
import { useBlog, useReader } from './ReaderProvider';

function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[#242424] font-medium uppercase text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
export { Avatar };

export function BlogHeader() {
  const { t, isAdmin, openSignIn } = useBlog();
  const { reader, loading } = useReader();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [menu, setMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide on scroll down, reveal on scroll up — like Medium.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/blog?q=${encodeURIComponent(q.trim())}` : '/blog');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#f2f2f2] bg-white transition-transform duration-300 ${hidden ? '-translate-y-full' : ''}`}
    >
      <div className="flex h-[57px] items-center gap-4 px-4 sm:px-6">
        <Link href="/blog" className="flex shrink-0 items-center gap-2" aria-label="Blog home">
          <span className="font-story text-[26px] font-bold leading-none tracking-tight text-[#242424]">Arden</span>
          <span className="hidden rounded-full border border-[#e6e6e6] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b] sm:inline">
            {t('brand')}
          </span>
        </Link>

        <form onSubmit={submit} className="hidden min-w-0 max-w-[240px] flex-1 items-center gap-2 rounded-full bg-[#f9f9f9] px-4 py-2 md:flex" role="search">
          <Search className="h-5 w-5 shrink-0 text-[#6b6b6b]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#242424] outline-none placeholder:text-[#6b6b6b]"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-5">
          <Link href="/" className="hidden items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#242424] lg:flex">
            <Home className="h-[18px] w-[18px]" /> ardenbouet.me
          </Link>
          <Link href="/blog/search" className="rounded-full p-2 text-[#6b6b6b] hover:text-[#242424] md:hidden" aria-label={t('search')}>
            <Search className="h-6 w-6" />
          </Link>
          {isAdmin && (
            <Link href="/admin/blog/new" className="flex items-center gap-2 p-2 text-sm text-[#6b6b6b] hover:text-[#242424]">
              <PenSquare className="h-6 w-6" strokeWidth={1.4} />
              <span className="hidden sm:inline">{t('write')}</span>
            </Link>
          )}
          <Link href="/blog/subscribe" className="hidden p-2 text-[#6b6b6b] hover:text-[#242424] sm:block" aria-label={t('subscribe')}>
            <Bell className="h-6 w-6" strokeWidth={1.4} />
          </Link>

          {loading ? (
            <span className="h-8 w-8 animate-pulse rounded-full bg-[#f2f2f2]" />
          ) : reader ? (
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenu(m => !m)} className="flex items-center gap-1" aria-haspopup="menu" aria-expanded={menu}>
                <Avatar name={reader.name} image={reader.image} />
                <ChevronDown className="hidden h-4 w-4 text-[#6b6b6b] sm:block" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 top-11 w-60 rounded-md border border-[#f2f2f2] bg-white py-2 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={reader.name} image={reader.image} size={40} />
                    <span className="truncate font-medium text-[#242424]">{reader.name}</span>
                  </div>
                  <div className="my-1 h-px bg-[#f2f2f2]" />
                  <Link role="menuitem" href="/blog/reading-list" onClick={() => setMenu(false)} className="flex items-center gap-3 px-5 py-2.5 text-[#6b6b6b] hover:text-[#242424]">
                    <Bookmark className="h-5 w-5" strokeWidth={1.4} /> {t('readingList')}
                  </Link>
                  <button role="menuitem" type="button" onClick={() => signOut({ callbackUrl: window.location.href })} className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-[#6b6b6b] hover:text-[#242424]">
                    <LogOut className="h-5 w-5" strokeWidth={1.4} /> {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn()}
              className="rounded-full bg-[#242424] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              {t('signIn')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
