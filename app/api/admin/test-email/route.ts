import { NextRequest, NextResponse } from 'next/server';
import { sendPurchaseEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: 'Missing "to"' }, { status: 400 });

  try {
    await sendPurchaseEmail({
      customerName:  'Test User',
      customerEmail: to,
      productTitle:  'Test Product',
      amount:        9.99,
      currency:      'USD',
      paymentRef:    'test_ref_123',
      isService:     false,
      downloadToken: 'test-token-abc',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
