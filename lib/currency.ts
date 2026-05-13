export const CURRENCIES = [
  { code: 'USD', symbol: '$',    label: 'USD – US Dollar'       },
  { code: 'EUR', symbol: '€',    label: 'EUR – Euro'            },
  { code: 'GBP', symbol: '£',    label: 'GBP – British Pound'   },
  { code: 'KES', symbol: 'KSh',  label: 'KES – Kenyan Shilling' },
  { code: 'NGN', symbol: '₦',    label: 'NGN – Nigerian Naira'  },
  { code: 'XAF', symbol: 'FCFA', label: 'XAF – CFA Franc'      },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export const FX: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  KES: 130,
  NGN: 1600,
  XAF: 600,
};

export const LS_KEY = 'arden_currency';

export function formatPrice(price: number, baseCurrency: string, display: CurrencyCode): string {
  const baseRate = FX[baseCurrency.toUpperCase() as CurrencyCode] ?? 1;
  const converted = (price / baseRate) * FX[display];
  const { symbol } = CURRENCIES.find(c => c.code === display)!;
  if (['KES', 'NGN', 'XAF'].includes(display)) {
    return `${symbol} ${Math.round(converted).toLocaleString()}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}
