'use client';
// Admin chrome. <AdminFrame> (mounted once in app/admin/layout.tsx) owns the persistent,
// collapsible sidebar; each page renders <AdminShell title actions> for its header + content.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  FileText, MessageSquare, UserCog, CalendarDays, Mail, Library, LayoutDashboard, ShoppingBag, Users, Image as ImageIcon, Settings, LogOut, Menu, X, PenSquare, ExternalLink,
  FolderKanban, Briefcase, GraduationCap, Package, Inbox, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { ThemeToggle } from '@/components/site/ThemeToggle';
import '@/app/blog/story.css';

type Item = { href: string; label: string; icon: typeof FileText; exact?: boolean };

const SECTIONS: { title: string; items: Item[] }[] = [
  { title: '', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  { title: 'Blog', items: [
    { href: '/admin/blog', label: 'Stories', icon: FileText, exact: true },
    { href: '/admin/blog/comments', label: 'Responses', icon: MessageSquare },
    { href: '/admin/blog/subscribers', label: 'Subscribers', icon: Mail },
    { href: '/admin/blog/series', label: 'Series', icon: Library },
  ] },
  { title: 'Site', items: [
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/experience', label: 'Experience', icon: Briefcase },
    { href: '/admin/journey', label: 'Education', icon: GraduationCap },
    { href: '/admin/media', label: 'Media library', icon: ImageIcon },
  ] },
  { title: 'Commerce', items: [
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  ] },
  { title: 'Business', items: [
    { href: '/admin/crm', label: 'CRM', icon: Users },
    { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { href: '/admin/messages', label: 'Messages', icon: Inbox },
  ] },
  { title: 'People', items: [
    { href: '/admin/users', label: 'Users & writers', icon: UserCog },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ] },
];

const FrameCtx = createContext<{ openMobile: () => void } | null>(null);
const COLLAPSE_KEY = 'admin_sidebar_collapsed';
let badgeCache: Record<string, number> = {};

/** Full-screen admin screens that bring their own chrome. */
const bare = (p: string) => p === '/admin/login' || /^\/admin\/blog\/(?!comments|subscribers|series)[^/]+$/.test(p);

function NavLinks({ collapsed, pathname, badges, onNavigate }: { collapsed: boolean; pathname: string; badges: Record<string, number>; onNavigate?: () => void }) {
  const isActive = (it: Item) => (it.exact ? pathname === it.href : pathname.startsWith(it.href));
  return (
    <div className="thin-scroll mt-5 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3">
      {SECTIONS.map(s => (
        <div key={s.title || 'top'}>
          {s.title && (
            <p className={`overflow-hidden whitespace-nowrap px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b9b9b] transition-all duration-200 ${collapsed ? 'h-0 pb-0 opacity-0' : 'h-5 pb-2 opacity-100'}`}>{s.title}</p>
          )}
          {collapsed && s.title && <div className="mx-3 mb-2 h-px bg-[#f2f2f2]" />}
          <ul className="space-y-0.5">
            {s.items.map(it => {
              const active = isActive(it);
              const badge = badges[it.href];
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    title={collapsed ? it.label : undefined}
                    className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors duration-150 ${active ? 'bg-[#f2f2f2] font-medium text-[#242424]' : 'text-[#6b6b6b] hover:bg-[#f6f6f6] hover:text-[#242424]'}`}
                  >
                    {active && <span className="absolute left-0 top-1.5 h-6 w-[3px] rounded-r bg-[#242424]" />}
                    <it.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                    <span className={`flex-1 truncate transition-opacity duration-150 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{it.label}</span>
                    {!!badge && (
                      <span className={`rounded-full bg-[#1a8917] text-[11px] font-medium text-white transition-all ${collapsed ? 'absolute right-1.5 top-1 h-2 w-2 p-0 text-[0px]' : 'px-1.5'}`}>{badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/admin';
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>(badgeCache);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* ignore */ }
    // Enable width transitions only after the saved state is applied (no animated jump on load).
    requestAnimationFrame(() => setReady(true));
  }, []);
  useEffect(() => {
    if (bare(pathname)) return;
    fetch('/api/admin/badges').then(r => (r.ok ? r.json() : {})).then(b => { badgeCache = b; setBadges(b); }).catch(() => {});
    setMobile(false);
  }, [pathname]);

  const toggle = () => setCollapsed(c => { try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ } return !c; });
  if (bare(pathname)) return <>{children}</>;

  const width = collapsed ? 72 : 248;
  const transition = ready ? 'transition-[width,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]' : '';

  const footer = (c: boolean) => (
    <div className="space-y-0.5 border-t border-[#f2f2f2] p-3">
      <a href="/" target="_blank" rel="noopener noreferrer" title={c ? 'View site' : undefined} className="flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] text-[#6b6b6b] hover:bg-[#f6f6f6] hover:text-[#242424]">
        <ExternalLink className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} /><span className={`truncate transition-opacity ${c ? 'opacity-0' : ''}`}>View site</span>
      </a>
      <button type="button" title={c ? 'Sign out' : undefined}
        onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}
        className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] text-[#6b6b6b] hover:bg-[#f6f6f6] hover:text-[#242424]">
        <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} /><span className={`truncate transition-opacity ${c ? 'opacity-0' : ''}`}>Sign out</span>
      </button>
    </div>
  );

  return (
    <FrameCtx.Provider value={{ openMobile: () => setMobile(true) }}>
      <div className="blog-ui min-h-screen bg-[#fafafa]">
        {/* Desktop sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-[#f2f2f2] bg-white lg:flex ${transition}`} style={{ width }}>
          <div className="flex h-16 shrink-0 items-center gap-2 px-5">
            <Link href="/admin" className="font-story text-[24px] font-bold text-[#242424]" title="Dashboard">{collapsed ? 'A' : 'Arden'}</Link>
            <span className={`rounded bg-[#f2f2f2] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b] transition-opacity ${collapsed ? 'opacity-0' : ''}`}>Admin</span>
          </div>
          <div className="px-3">
            <Link href="/admin/blog/new" title={collapsed ? 'Write a story' : undefined}
              className="flex h-10 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-[#242424] text-[14px] text-white transition-colors hover:bg-black">
              <PenSquare className="h-4 w-4 shrink-0" />{!collapsed && <span>Write a story</span>}
            </Link>
          </div>
          <NavLinks collapsed={collapsed} pathname={pathname} badges={badges} />
          {footer(collapsed)}
          <button type="button" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand' : 'Collapse'}
            className="flex h-10 items-center gap-3 border-t border-[#f2f2f2] px-6 text-[13px] text-[#9b9b9b] hover:text-[#242424]">
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" /> Collapse</>}
          </button>
        </aside>

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-50 lg:hidden ${mobile ? '' : 'pointer-events-none'}`} aria-hidden={!mobile}>
          <div className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${mobile ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobile(false)} />
          <aside className={`absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-story text-[24px] font-bold text-[#242424]">Arden</span>
              <button type="button" onClick={() => setMobile(false)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <NavLinks collapsed={false} pathname={pathname} badges={badges} onNavigate={() => setMobile(false)} />
            {footer(false)}
          </aside>
        </div>

        <div className={`lg:pl-[var(--admin-sidebar)] ${transition}`} style={{ ['--admin-sidebar' as string]: `${width}px` }}>{children}</div>
      </div>
    </FrameCtx.Provider>
  );
}

/** Page header + content area inside the persistent admin frame. */
export function AdminShell({ children, title, actions, flush = false }: {
  children: ReactNode;
  title: string;
  /** No page padding (full-bleed tools like the media library). */
  flush?: boolean;
  actions?: ReactNode;
  badges?: Record<string, number>;
}) {
  const frame = useContext(FrameCtx);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#f2f2f2] bg-white/90 px-4 backdrop-blur sm:px-8">
        <button type="button" className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2] lg:hidden" onClick={() => frame?.openMobile()} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-[#242424]">{title}</h1>
        <div className="ml-auto flex items-center gap-2">{actions}<ThemeToggle /></div>
      </header>
      <main className={`animate-[admin-in_.25s_ease-out] ${flush ? '' : 'px-4 py-6 sm:px-8 sm:py-8'}`}>{children}</main>
    </>
  );
}
