// lib/money.ts — currency-aware totals. Amounts are never added across currencies directly:
// each currency is summed on its own, and a combined figure is converted to the base currency with the
// site's fixed rates (lib/currency.ts). Pure module, safe on server and client.
import { FX } from '@/lib/currency';

export const BASE_CURRENCY = 'USD';

export const normCurrency = (c?: string | null) => (c || BASE_CURRENCY).trim().toUpperCase();

/** Units of `currency` per 1 USD, or null for currencies we have no rate for. */
const rate = (currency: string) => (FX as Record<string, number>)[normCurrency(currency)] ?? null;

/** Converts an amount to the base currency (null when the currency has no known rate). */
export function toBase(amount: number, currency?: string | null): number | null {
  const r = rate(normCurrency(currency));
  return r ? amount / r : null;
}

export type CurrencyTotal = { currency: string; amount: number; count: number };

export type MoneySummary = {
  /** Sum of everything convertible, in BASE_CURRENCY. */
  base: number;
  baseCurrency: string;
  /** Exact per-currency sums, largest (in base terms) first. */
  byCurrency: CurrencyTotal[];
  /** True when the total had to be converted (more than one currency, or one that isn't the base). */
  converted: boolean;
  /** Currencies without a known rate (left out of `base`, still listed in byCurrency). */
  unconverted: string[];
  count: number;
};

export function summarize(rows: { amount: number; currency?: string | null }[]): MoneySummary {
  const map = new Map<string, CurrencyTotal>();
  for (const r of rows) {
    const c = normCurrency(r.currency);
    const t = map.get(c) ?? { currency: c, amount: 0, count: 0 };
    t.amount += r.amount;
    t.count += 1;
    map.set(c, t);
  }
  const byCurrency = Array.from(map.values()).sort((a, b) => (toBase(b.amount, b.currency) ?? 0) - (toBase(a.amount, a.currency) ?? 0));
  const unconverted = byCurrency.filter(t => rate(t.currency) === null).map(t => t.currency);
  const base = byCurrency.reduce((s, t) => s + (toBase(t.amount, t.currency) ?? 0), 0);
  return {
    base, baseCurrency: BASE_CURRENCY, byCurrency, unconverted,
    converted: byCurrency.some(t => t.currency !== BASE_CURRENCY),
    count: byCurrency.reduce((s, t) => s + t.count, 0),
  };
}

export const emptySummary = (): MoneySummary => summarize([]);

export function formatMoney(amount: number, currency?: string | null, opts: { locale?: string; compact?: boolean } = {}): string {
  const c = normCurrency(currency);
  const big = Math.abs(amount) >= 1000;
  try {
    return new Intl.NumberFormat(opts.locale ?? 'en-US', {
      style: 'currency', currency: c,
      notation: opts.compact && Math.abs(amount) >= 100_000 ? 'compact' : 'standard',
      maximumFractionDigits: big || ['KES', 'NGN', 'XAF', 'JPY'].includes(c) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${c} ${amount.toFixed(2)}`;
  }
}

/** Headline for a summary: exact when a single currency, "≈ $X" when converted. */
export function formatSummary(s: MoneySummary, opts: { locale?: string; compact?: boolean } = {}): string {
  if (s.byCurrency.length === 0) return formatMoney(0, s.baseCurrency, opts);
  if (s.byCurrency.length === 1) return formatMoney(s.byCurrency[0].amount, s.byCurrency[0].currency, opts);
  return `≈ ${formatMoney(s.base, s.baseCurrency, opts)}`;
}

/** "$1,240 · KSh 52,000" — the exact amounts behind a converted total. */
export function formatBreakdown(s: MoneySummary, opts: { locale?: string; compact?: boolean } = {}): string {
  return s.byCurrency.map(t => formatMoney(t.amount, t.currency, opts)).join(' · ');
}
