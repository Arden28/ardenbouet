'use client';
// /admin — dashboard: range filter, quick actions, KPIs, charts, queues and activity.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PenSquare, Package, FolderKanban, UserPlus, Upload, Receipt, CalendarCog, ArrowUpRight, ArrowDownRight,
  ShoppingBag, MessageCircle, CalendarDays, Mail, Feather, Users, Eye, AlertCircle,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { BarChart } from '@/components/admin/BarChart';
import { Spinner } from '@/components/admin/ui';
import { openMediaPicker } from '@/components/admin/media/MediaPicker';
import '@/app/blog/story.css';

type Dash = {
  range: string; unit: 'day' | 'month';
  kpis: {
    revenue: { value: number; delta: number | null; orders: number; donations: number };
    pendingOrders: number;
    audience: { readers: number; readersDelta: number | null; subscribers: number; subscribersDelta: number | null; activeSubscribers: number };
    blog: { posts: number; published: number; views: number; claps: number; responses: number; responsesDelta: number | null; hidden: number; review: number };
    bookings: { upcoming: number; created: number };
    messages: { unread: number; created: number };
    crm: { activeProjects: number; pipeline: number; openInvoices: number; openAmount: number; overdue: number };
    writerRequests: number;
  };
  series: { revenue: { key: string; value: number }[]; audience: { key: string; value: number }[] };
  topStories: { id: string; title: string; slug: string; views: number; responses: number }[];
  activity: { type: string; at: string; title: string; meta: string; href: string; unread?: boolean }[];
};

const RANGES = [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['12m', '12 months'], ['all', 'All time']] as const;
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n);
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: n >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

function Delta({ v }: { v: number | null }) {
  if (v === null || v === 0) return null;
  const up = v > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${up ? 'text-[#1a6b17]' : 'text-[#c94a4a]'}`}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(v)}%
    </span>
  );
}

function Kpi({ label, value, sub, delta, href, icon: Icon }: { label: string; value: string; sub?: string; delta?: number | null; href?: string; icon: typeof Eye }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] text-[#6b6b6b]"><Icon className="h-4 w-4" strokeWidth={1.6} /> {label}</span>
        {delta !== undefined && <Delta v={delta} />}
      </div>
      <p className="mt-3 text-[30px] font-semibold tabular-nums tracking-[-0.02em] text-[#242424]">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-[#9b9b9b]">{sub}</p>}
    </>
  );
  const cls = 'block rounded-2xl border border-[#f0f0f0] bg-white p-5 transition-colors';
  return href ? <Link href={href} className={`${cls} hover:border-[#d4d4d4]`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

const ACTIVITY_ICON: Record<string, typeof Eye> = { order: ShoppingBag, response: MessageCircle, booking: CalendarDays, message: Mail, writer: Feather, subscriber: Users };

export default function Dashboard() {
  const [range, setRange] = useState<string>('30d');
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => {
    try { const saved = localStorage.getItem('admin_dash_range'); if (saved) setRange(saved); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('admin_dash_range', range); } catch { /* ignore */ }
    setD(null);
    fetch(`/api/admin/dashboard?range=${range}`, { cache: 'no-store' }).then(r => r.json()).then(setD);
  }, [range]);

  const actions = [
    { label: 'Write a story', href: '/admin/blog/new', icon: PenSquare },
    { label: 'New product', href: '/admin/products?new=1', icon: Package },
    { label: 'New project', href: '/admin/projects?new=1', icon: FolderKanban },
    { label: 'Invite a writer', href: '/admin/users?tab=invites', icon: UserPlus },
    { label: 'Create invoice', href: '/admin/crm?tab=invoices&new=1', icon: Receipt },
    { label: 'Availability', href: '/admin/bookings/settings', icon: CalendarCog },
  ];

  const k = d?.kpis;
  const attention = k ? [
    k.blog.review ? { label: `${k.blog.review} ${k.blog.review === 1 ? 'story' : 'stories'} waiting for review`, href: '/admin/blog' } : null,
    k.writerRequests ? { label: `${k.writerRequests} writer ${k.writerRequests === 1 ? 'request' : 'requests'}`, href: '/admin/users?tab=requests' } : null,
    k.messages.unread ? { label: `${k.messages.unread} unread ${k.messages.unread === 1 ? 'message' : 'messages'}`, href: '/admin/messages' } : null,
    k.pendingOrders ? { label: `${k.pendingOrders} pending ${k.pendingOrders === 1 ? 'order' : 'orders'}`, href: '/admin/orders' } : null,
    k.crm.overdue ? { label: `${k.crm.overdue} overdue ${k.crm.overdue === 1 ? 'invoice' : 'invoices'}`, href: '/admin/crm?tab=invoices' } : null,
    k.blog.hidden ? { label: `${k.blog.hidden} hidden ${k.blog.hidden === 1 ? 'response' : 'responses'}`, href: '/admin/blog/comments' } : null,
  ].filter((x): x is { label: string; href: string } => !!x) : [];

  return (
    <AdminShell
      title="Dashboard"
      actions={
        <div className="flex rounded-full bg-[#f2f2f2] p-0.5 text-[13px]" role="tablist" aria-label="Date range">
          {RANGES.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={range === key} onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1.5 transition-colors ${range === key ? 'bg-white font-medium text-[#242424] shadow-sm' : 'text-[#6b6b6b] hover:text-[#242424]'}`}>
              <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{key}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {actions.map(a => (
            <Link key={a.label} href={a.href} className="flex shrink-0 items-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[13px] text-[#242424] transition-colors hover:border-[#242424]">
              <a.icon className="h-4 w-4" strokeWidth={1.6} /> {a.label}
            </Link>
          ))}
          <button type="button" onClick={() => openMediaPicker({ title: 'Media library' })} className="flex shrink-0 items-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[13px] text-[#242424] transition-colors hover:border-[#242424]">
            <Upload className="h-4 w-4" strokeWidth={1.6} /> Upload media
          </button>
        </div>

        {!d || !k ? <Spinner /> : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={ShoppingBag} label="Revenue" value={money(k.revenue.value)} delta={k.revenue.delta} sub={`${k.revenue.orders} orders · ${k.revenue.donations} donations`} href="/admin/orders" />
              <Kpi icon={Users} label="New readers" value={compact(k.audience.readers)} delta={k.audience.readersDelta} sub={`${k.audience.subscribers} new subscribers · ${k.audience.activeSubscribers} total`} href="/admin/users" />
              <Kpi icon={MessageCircle} label="Responses" value={compact(k.blog.responses)} delta={k.blog.responsesDelta} sub={`${compact(k.blog.claps)} claps · ${compact(k.blog.views)} views all-time`} href="/admin/blog/comments" />
              <Kpi icon={CalendarDays} label="Upcoming calls" value={String(k.bookings.upcoming)} sub={`${k.bookings.created} booked in range`} href="/admin/bookings" />
              <Kpi icon={Receipt} label="Outstanding invoices" value={money(k.crm.openAmount)} sub={`${k.crm.openInvoices} open${k.crm.overdue ? ` · ${k.crm.overdue} overdue` : ''}`} href="/admin/crm?tab=invoices" />
              <Kpi icon={FolderKanban} label="CRM pipeline" value={money(k.crm.pipeline)} sub={`${k.crm.activeProjects} active projects`} href="/admin/crm?tab=projects" />
              <Kpi icon={PenSquare} label="Stories" value={String(k.blog.posts)} sub={`${k.blog.published} published in range`} href="/admin/blog" />
              <Kpi icon={Mail} label="Messages" value={String(k.messages.created)} sub={`${k.messages.unread} unread`} href="/admin/messages" />
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                <h3 className="text-[14px] font-semibold text-[#242424]">Revenue</h3>
                <p className="mb-4 text-[12px] text-[#9b9b9b]">Paid orders + donations to you, per {d.unit}</p>
                <BarChart data={d.series.revenue} format={money} label="Revenue" unit={d.unit} />
              </section>
              <section className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                <h3 className="text-[14px] font-semibold text-[#242424]">Audience growth</h3>
                <p className="mb-4 text-[12px] text-[#9b9b9b]">New readers + confirmed subscribers, per {d.unit}</p>
                <BarChart data={d.series.audience} format={n => compact(n)} label="New people" unit={d.unit} />
              </section>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
              <section className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#242424]"><AlertCircle className="h-4 w-4" /> Needs your attention</h3>
                {attention.length === 0 ? <p className="mt-6 text-[14px] text-[#9b9b9b]">All clear. Nothing waiting on you.</p> : (
                  <ul className="mt-3">
                    {attention.map(a => (
                      <li key={a.label}><Link href={a.href} className="flex items-center justify-between gap-3 border-b border-[#f6f6f6] py-2.5 text-[14px] text-[#242424] last:border-0 hover:text-[#1a8917]">{a.label} <ArrowUpRight className="h-4 w-4 text-[#9b9b9b]" /></Link></li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                <h3 className="text-[14px] font-semibold text-[#242424]">Top stories</h3>
                <ol className="mt-3">
                  {d.topStories.length === 0 && <li className="mt-3 text-[14px] text-[#9b9b9b]">Publish a story to see it here.</li>}
                  {d.topStories.map((s, i) => (
                    <li key={s.id} className="flex items-baseline gap-3 border-b border-[#f6f6f6] py-2.5 last:border-0">
                      <span className="font-story text-[18px] text-[#c4c4c4]">{i + 1}</span>
                      <Link href={`/admin/blog/${s.id}`} className="min-w-0 flex-1 truncate text-[14px] text-[#242424] hover:underline">{s.title || 'Untitled'}</Link>
                      <span className="flex shrink-0 items-center gap-1 text-[12px] tabular-nums text-[#6b6b6b]"><Eye className="h-3.5 w-3.5" /> {compact(s.views)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                <h3 className="text-[14px] font-semibold text-[#242424]">Recent activity</h3>
                <ul className="mt-3">
                  {d.activity.length === 0 && <li className="mt-3 text-[14px] text-[#9b9b9b]">No activity yet.</li>}
                  {d.activity.map((a, i) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? Eye;
                    const meta = a.type === 'booking' ? `Call on ${new Date(a.meta.replace(/^cancelled · /, '')).toLocaleString()}${a.meta.startsWith('cancelled') ? ' · cancelled' : ''}` : a.meta;
                    return (
                      <li key={i}>
                        <Link href={a.href} className="flex items-start gap-3 border-b border-[#f6f6f6] py-2.5 last:border-0">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f6f6f6] text-[#6b6b6b]"><Icon className="h-3.5 w-3.5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 truncate text-[13px] text-[#242424]">{a.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a8917]" />}{a.title}</span>
                            <span className="block truncate text-[12px] text-[#9b9b9b]">{meta}</span>
                          </span>
                          <span className="shrink-0 text-[12px] text-[#9b9b9b]">{ago(a.at)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
