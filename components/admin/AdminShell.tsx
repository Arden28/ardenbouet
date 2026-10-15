'use client';
// Sidebar shell for the redesigned admin. The blog section uses it first; the other sections
// (site content, shop, CRM) still live in the legacy tabbed CMS at /admin until they migrate.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  FileText, MessageSquare, Mail, Library, LayoutDashboard, ShoppingBag, Users, Image as ImageIcon, Settings, LogOut, Menu, X, PenSquare, ExternalLink,
} from 'lucide-react';

type Item = { href: string; label: string; icon: typeof FileText; exact?: boolean; badge?: number };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Blog',
    items: [
      { href: '/admin/blog', label: 'Stories', icon: FileText, exact: true },
      { href: '/admin/blog/comments', label: 'Responses', icon: MessageSquare },
      { href: '/admin/blog/subscribers', label: 'Subscribers', icon: Mail },
      { href: '/admin/blog/series', label: 'Series', icon: Library },
    ],
  },
  {
    title: 'Site',
    items: [
      { href: '/admin?tab=projects', label: 'Portfolio content', icon: LayoutDashboard },
      { href: '/admin?tab=shop', label: 'Shop', icon: ShoppingBag },
      { href: '/admin?tab=crm', label: 'CRM', icon: Users },
      { href: '/admin?tab=media', label: 'Media', icon: ImageIcon },
      { href: '/admin?tab=settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminShell({ children, title, actions, badges }: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (it: Item) => (it.exact ? pathname === it.href : pathname.startsWith(it.href.split('?')[0]) && !it.href.includes('?'));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link href="/blog" className="font-story text-[24px] font-bold text-[#242424]">Arden</Link>
        <span className="rounded bg-[#f2f2f2] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b]">Admin</span>
      </div>
      <div className="px-3">
        <Link href="/admin/blog/new" className="flex items-center justify-center gap-2 rounded-full bg-[#242424] px-4 py-2.5 text-[14px] text-white hover:bg-black">
          <PenSquare className="h-4 w-4" /> Write a story
        </Link>
      </div>
      <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-3">
        {SECTIONS.map(s => (
          <div key={s.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b9b9b]">{s.title}</p>
            <ul className="space-y-0.5">
              {s.items.map(it => {
                const active = isActive(it);
                const badge = badges?.[it.href];
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors ${active ? 'bg-[#f2f2f2] font-medium text-[#242424]' : 'text-[#6b6b6b] hover:bg-[#f9f9f9] hover:text-[#242424]'}`}
                    >
                      <it.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                      <span className="flex-1">{it.label}</span>
                      {!!badge && <span className="rounded-full bg-[#1a8917] px-1.5 text-[11px] font-medium text-white">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-0.5 border-t border-[#f2f2f2] p-3">
        <a href="/blog" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-[#6b6b6b] hover:bg-[#f9f9f9] hover:text-[#242424]">
          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.6} /> View blog
        </a>
        <button
          type="button"
          onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-[#6b6b6b] hover:bg-[#f9f9f9] hover:text-[#242424]"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="blog-ui min-h-screen bg-[#fafafa]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-[#f2f2f2] bg-white lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/20 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[268px] bg-white shadow-xl" onClick={e => e.stopPropagation()}>{nav}</aside>
        </div>
      )}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#f2f2f2] bg-white/90 px-4 backdrop-blur sm:px-8">
          <button type="button" className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2] lg:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-[#242424]">{title}</h1>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
