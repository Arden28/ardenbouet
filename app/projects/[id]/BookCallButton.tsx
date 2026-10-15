'use client';
import { CalendarDays } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';

export function BookCallButton() {
  const { ui, openBooking } = useSite();
  return (
    <button type="button" onClick={() => openBooking()} className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-medium text-[#242424] transition-colors hover:bg-[#f2f2f2]">
      <CalendarDays className="h-[18px] w-[18px]" /> {ui('home.book.cta')}
    </button>
  );
}
