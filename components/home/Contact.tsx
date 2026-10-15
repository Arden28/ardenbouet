'use client';
// "Have something in mind?" — booking + a short contact form (stored as a Message, emailed to the owner).
import { useState } from 'react';
import { CalendarDays, Check, Loader2, Mail } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import type { UiKey } from '@/lib/i18n/ui';

const SERVICES: UiKey[] = ['home.contact.svc.saas', 'home.contact.svc.mobility', 'home.contact.svc.travel', 'home.contact.svc.api', 'home.contact.svc.consult'];
const BUDGETS = ['< $500', '$500 – 2k', '$2 – 8k', '$8 – 20k', '$20k +'];

export function Contact({ email }: { email?: string }) {
  const { ui, openBooking } = useSite();
  const [form, setForm] = useState({ name: '', email: '', message: '', services: [] as string[], budget: 0 });
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('busy');
    setError('');
    const website = (new FormData(e.currentTarget).get('website') as string) || '';
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, budget: form.budget || undefined, website }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setState('idle'); setError(d.error || 'Something went wrong'); return; }
    setState('sent');
  };
  const toggle = (s: string) => setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));
  const field = 'w-full border-b border-[#d4d4d4] bg-transparent py-3 text-[16px] text-[#242424] outline-none transition-colors placeholder:text-[#9b9b9b] focus:border-[#242424]';

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20 border-t border-[#f2f2f2]">
      <div className="mx-auto grid max-w-[1192px] gap-14 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20 lg:py-24">
        <div>
          <h2 id="contact-title" className="font-story text-[44px] leading-[1.05] tracking-[-0.025em] text-[#242424] sm:text-[56px]">{ui('home.contact.title')}</h2>
          <p className="mt-5 max-w-[440px] font-story text-[20px] leading-[1.5] text-[#6b6b6b]">{ui('home.contact.sub')}</p>
          <div className="mt-9 flex flex-col items-start gap-4">
            <button type="button" onClick={() => openBooking()} className="flex items-center gap-2.5 rounded-full bg-[#242424] py-3 pl-5 pr-6 text-[15px] font-medium text-white transition-colors hover:bg-black">
              <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.8} /> {ui('home.book.cta')}
            </button>
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-[15px] text-[#6b6b6b] hover:text-[#242424]">
                <Mail className="h-4 w-4" /> {ui('home.contact.or')} <span className="text-[#242424] underline decoration-[#d4d4d4] underline-offset-4">{email}</span>
              </a>
            )}
          </div>
        </div>

        {state === 'sent' ? (
          <div className="flex flex-col items-start justify-center rounded-3xl bg-[#f3faf3] p-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><Check className="h-6 w-6 text-[#1a8917]" /></span>
            <p className="mt-5 font-story text-[24px] leading-8 text-[#242424]">{ui('home.contact.sent')}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl border border-[#ececec] bg-white p-7 sm:p-10">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-6 sm:grid-cols-2">
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={ui('home.contact.name')} aria-label={ui('home.contact.name')} autoComplete="name" className={field} />
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={ui('home.contact.email')} aria-label={ui('home.contact.email')} autoComplete="email" className={field} />
            </div>
            <fieldset className="mt-8">
              <legend className="text-[13px] font-medium text-[#6b6b6b]">{ui('home.contact.about')}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {SERVICES.map(s => {
                  const label = ui(s);
                  const on = form.services.includes(label);
                  return (
                    <button key={s} type="button" onClick={() => toggle(label)} aria-pressed={on}
                      className={`rounded-full px-3.5 py-1.5 text-[14px] transition-colors ${on ? 'bg-[#242424] text-white' : 'bg-[#f4f4f4] text-[#242424] hover:bg-[#ececec]'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="mt-7">
              <legend className="text-[13px] font-medium text-[#6b6b6b]">{ui('home.contact.budget')}</legend>
              <div className="mt-3 grid grid-cols-5 overflow-hidden rounded-full border border-[#ececec] text-[12px] sm:text-[13px]">
                {BUDGETS.map((b, i) => (
                  <button key={b} type="button" onClick={() => setForm({ ...form, budget: form.budget === i + 1 ? 0 : i + 1 })} aria-pressed={form.budget === i + 1}
                    className={`py-2 transition-colors ${i ? 'border-l border-[#ececec]' : ''} ${form.budget === i + 1 ? 'bg-[#242424] text-white' : 'text-[#6b6b6b] hover:bg-[#fafafa]'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </fieldset>
            <textarea required minLength={10} rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={ui('home.contact.message')} aria-label={ui('home.contact.message')}
              className={`${field} mt-7 resize-none font-story text-[17px] leading-7`} />
            {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
            <button type="submit" disabled={state === 'busy'} className="mt-8 flex items-center gap-2 rounded-full bg-[#1a8917] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#156d12] disabled:opacity-60">
              {state === 'busy' && <Loader2 className="h-4 w-4 animate-spin" />}{ui('home.contact.send')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
