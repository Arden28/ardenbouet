// lib/paypal.ts — server-side PayPal helpers. Payment state always comes from PayPal's API,
// never from a request body (webhooks are verified by looking the order up).
import 'server-only';

const base = () => process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';

export async function getPayPalToken(): Promise<string> {
  const creds = Buffer.from(`${process.env.PAYPAL_CLIENT_ID ?? ''}:${process.env.PAYPAL_CLIENT_SECRET ?? ''}`).toString('base64');
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('PayPal authentication failed');
  return json.access_token as string;
}

type Captured = { value: number; currency: string } | null;

/** The completed capture of a PayPal order, straight from PayPal (null if not completed). */
export function capturedAmount(order: { status?: string; purchase_units?: { payments?: { captures?: { status?: string; amount?: { value?: string; currency_code?: string } }[] } }[] }): Captured {
  if (order?.status !== 'COMPLETED') return null;
  const cap = order.purchase_units?.[0]?.payments?.captures?.find(c => c.status === 'COMPLETED') ?? order.purchase_units?.[0]?.payments?.captures?.[0];
  const value = Number(cap?.amount?.value ?? NaN);
  return Number.isFinite(value) ? { value, currency: String(cap?.amount?.currency_code ?? '').toUpperCase() } : null;
}

export async function getPayPalOrder(orderId: string) {
  const token = await getPayPalToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return res.ok ? res.json() : null;
}

/** True when PayPal says the order was captured in full for our stored amount and currency. */
export function coversOrder(captured: Captured, order: { amount: number; currency: string }): boolean {
  return !!captured && captured.currency === order.currency.toUpperCase() && captured.value + 0.005 >= order.amount;
}
