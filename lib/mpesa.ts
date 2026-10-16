// lib/mpesa.ts — Daraja (M-Pesa) helpers. The STK callback is unsigned, so a "paid" callback is only
// trusted after Safaricom's STK query confirms the same CheckoutRequestID succeeded.
import 'server-only';

/** https://sandbox.safaricom.co.ke (default) or https://api.safaricom.co.ke in production. */
export const darajaBase = () => (process.env.MPESA_BASE || 'https://sandbox.safaricom.co.ke').replace(/\/$/, '');

export async function getDarajaToken(): Promise<string> {
  const creds = Buffer.from(`${process.env.MPESA_CONSUMER_KEY ?? ''}:${process.env.MPESA_CONSUMER_SECRET ?? ''}`).toString('base64');
  const res = await fetch(`${darajaBase()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${creds}` }, cache: 'no-store' });
  const json = await res.json();
  if (!json.access_token) throw new Error('Daraja authentication failed');
  return json.access_token as string;
}

export function stkPassword(timestamp: string) {
  return Buffer.from(`${process.env.MPESA_SHORTCODE ?? ''}${process.env.MPESA_PASSKEY ?? ''}${timestamp}`).toString('base64');
}

export const stkTimestamp = () => new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

/** Asks Safaricom whether an STK push succeeded. true = paid, false = failed/cancelled, null = still pending/unknown. */
export async function stkPaid(checkoutRequestId: string): Promise<boolean | null> {
  const timestamp = stkTimestamp();
  const res = await fetch(`${darajaBase()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getDarajaToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ BusinessShortCode: process.env.MPESA_SHORTCODE, Password: stkPassword(timestamp), Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (json.ResultCode === undefined) return null; // e.g. "transaction is being processed"
  return String(json.ResultCode) === '0';
}
