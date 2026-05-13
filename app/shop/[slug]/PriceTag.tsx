'use client';
import { useState, useEffect } from 'react';
import { formatPrice, CURRENCIES, LS_KEY } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';

export default function PriceTag({
  price,
  baseCurrency,
  fallback,
  className,
}: {
  price: number;
  baseCurrency: string;
  fallback: string;
  className?: string;
}) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as CurrencyCode | null;
    if (saved && CURRENCIES.some(c => c.code === saved)) {
      setLabel(formatPrice(price, baseCurrency, saved));
    }
  }, [price, baseCurrency]);

  return <span className={className}>{label}</span>;
}
