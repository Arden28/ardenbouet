'use client';
// The Medium-style top bar for the whole public site (home, blog, projects, shop, account…).
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Search, PenSquare, ChevronDown, LogOut, User, Bookmark, FileText, Shield, Menu, X, Feather, CalendarDays } from 'lucide-react';
import { splitLocale } from '@/lib/i18n/config';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { useReader, useSite } from './SiteProviders';

export function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#242424] font-medium uppercase text-white" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(0, 1)}
    </span>
  );
}

/** Paths where the site chrome steps aside (they bring their own). */
export function hideChrome(path: string) {
  return path.startsWith('/admin') || path.startsWith('/write') || path === '/signin';
}

export function SiteHeader() {
  const { ui, href, isAdmin, openSignIn, me } = useSite();
  const { reader, loading } = useReader();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const params = useSearchParams();
  const path = splitLocale(pathname).path;
  const [q, setQ] = useState(params.get('q') ?? '');
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 160 && y > last && !mobile);
      setScrolled(y > 4);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobile]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);
  useEffect(() => { setMobile(false); setMenu(false); }, [pathname]);

  if (hideChrome(path)) return null;

  const nav = [
    { href: '/#work', label: ui('nav.work'), active: false },
    { href: '/blog', label: ui('nav.writing'), active: path.startsWith('/blog') },
    { href: '/shop', label: ui('nav.shop'), active: path.startsWith('/shop') },
  ];
  const isWriter = !!me?.writer.isWriter;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(href(q.trim() ? `/blog?q=${encodeURIComponent(q.trim())}` : '/blog'));
  };

  return (
    <header
      className={`blog-ui sticky top-0 z-50 bg-white transition-[transform,box-shadow] duration-300 ${hidden ? '-translate-y-full' : ''} ${scrolled ? 'shadow-[0_1px_0_#f2f2f2]' : ''}`}
    >
      <div className="mx-auto flex h-[60px] max-w-[1336px] items-center gap-4 px-4 sm:px-6">
        <Link href={href('/')} className="flex shrink-0 items-baseline gap-1.5" aria-label="Arden BOUET — home">
          <span className="font-story text-[27px] font-bold leading-none tracking-[-0.02em] text-[#242424]">Arden</span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-[#1a8917] sm:inline-block" aria-hidden />
        </Link>

        <form onSubmit={submit} className="hidden min-w-0 max-w-[240px] flex-1 items-center gap-2 rounded-full bg-[#f9f9f9] px-4 py-2 lg:flex" role="search">
          <Search className="h-[18px] w-[18px] shrink-0 text-[#6b6b6b]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={ui('nav.search')} aria-label={ui('nav.search')} className="min-w-0 flex-1 bg-transparent text-[14px] text-[#242424] outline-none placeholder:text-[#6b6b6b]" />
        </form>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map(n => (
            <Link
              key={n.href}
              href={href(n.href)}
              className={`rounded-full px-3 py-1.5 text-[14px] transition-colors ${n.active ? 'text-[#242424]' : 'text-[#6b6b6b] hover:text-[#242424]'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href={href('/book')} className="hidden items-center gap-2 rounded-full border border-[#242424] px-3.5 py-1.5 text-[14px] text-[#242424] transition-colors hover:bg-[#242424] hover:text-white sm:flex">
            <CalendarDays className="h-4 w-4" strokeWidth={1.6} /> {ui('nav.book')}
          </Link>
          {(isAdmin || isWriter) && (
            <Link href={isAdmin ? '/admin/blog/new' : '/write/new'} className="hidden items-center gap-2 p-2 text-[14px] text-[#6b6b6b] hover:text-[#242424] md:flex">
              <PenSquare className="h-[22px] w-[22px]" strokeWidth={1.3} /> {ui('nav.write')}
            </Link>
          )}
          <div className="hidden md:block"><LanguageSwitcher /></div>

          {loading ? (
            <span className="h-8 w-8 animate-pulse rounded-full bg-[#f2f2f2]" />
          ) : reader ? (
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenu(m => !m)} className="flex items-center gap-1 rounded-full p-0.5" aria-haspopup="menu" aria-expanded={menu}>
                <Avatar name={reader.name} image={reader.image} />
                <ChevronDown className="hidden h-4 w-4 text-[#6b6b6b] sm:block" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 top-11 w-64 rounded-md border border-[#f2f2f2] bg-white py-2 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
                  <Link role="menuitem" href={href('/me')} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa]">
                    <Avatar name={reader.name} image={reader.image} size={40} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[#242424]">{reader.name}</span>
                      {me?.reader.handle && <span className="block truncate text-[13px] text-[#6b6b6b]">@{me.reader.handle}</span>}
                    </span>
                  </Link>
                  <div className="my-1 h-px bg-[#f2f2f2]" />
                  <MenuLink href={href('/me')} icon={User}>{ui('nav.profile')}</MenuLink>
                  <MenuLink href={href('/me/library')} icon={Bookmark}>{ui('nav.library')}</MenuLink>
                  {isWriter
                    ? <MenuLink href={href('/me/stories')} icon={FileText}>{ui('nav.stories')}</MenuLink>
                    : <MenuLink href={href('/me/writer')} icon={Feather}>{ui('nav.becomeWriter')}</MenuLink>}
                  {isAdmin && <MenuLink href="/admin/blog" icon={Shield}>{ui('nav.admin')}</MenuLink>}
                  <div className="my-1 h-px bg-[#f2f2f2]" />
                  <button role="menuitem" type="button" onClick={() => signOut({ callbackUrl: window.location.href })} className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-[#6b6b6b] hover:text-[#242424]">
                    <LogOut className="h-[18px] w-[18px]" strokeWidth={1.4} /> {ui('auth.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => openSignIn()} className="rounded-full bg-[#242424] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-black">{ui('nav.signIn')}</button>
          )}

          <button type="button" onClick={() => setMobile(m => !m)} className="rounded-full p-2 text-[#242424] md:hidden" aria-label={ui('nav.menu')} aria-expanded={mobile}>
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="border-t border-[#f2f2f2] bg-white px-4 pb-6 pt-3 md:hidden">
          <form onSubmit={submit} className="mb-3 flex items-center gap-2 rounded-full bg-[#f6f6f6] px-4 py-2.5" role="search">
            <Search className="h-4 w-4 text-[#6b6b6b]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={ui('nav.search')} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </form>
          {[...nav, { href: '/book', label: ui('nav.book'), active: path === '/book' }].map(n => (
            <Link key={n.href} href={href(n.href)} className="block border-b border-[#f6f6f6] py-3.5 font-story text-[22px] text-[#242424]">{n.label}</Link>
          ))}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[13px] text-[#6b6b6b]">{ui('footer.language')}</span>
            <LanguageSwitcher variant="inline" />
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <Link role="menuitem" href={href} className="flex items-center gap-3 px-5 py-2.5 text-[#6b6b6b] hover:text-[#242424]">
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.4} /> {children}
    </Link>
  );
}
