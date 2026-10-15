// lib/meOrders.ts — a signed-in reader's shop orders, matched by the email on their account.
// Downloads reuse the existing DownloadToken flow (/download/[token] → /api/download/[token]).
import 'server-only';
import type { DownloadToken, Order, Reader } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ContentBundle, ShopProduct } from '@/app/admin/types';

export const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // same as fulfillOrder()

export type MeOrder = {
  id: string;
  createdAt: string;
  status: Order['status'];
  amount: number;
  currency: string;
  productId: string;
  productTitle: string;
  paymentProvider: string | null;
  product: { slug: string; cover: string | null; category: ShopProduct['category']; downloadable: boolean } | null;
  download: { token: string; state: 'ready' | 'expired' | 'exhausted'; expiresAt: string; left: number; max: number } | null;
};

async function products(): Promise<ShopProduct[]> {
  const row = await prisma.content.findUnique({ where: { id: 1 } });
  return ((row?.data as ContentBundle | null)?.products ?? []) as ShopProduct[];
}

const tokenState = (t: DownloadToken): 'ready' | 'expired' | 'exhausted' =>
  t.expiresAt < new Date() ? 'expired' : t.downloadCount >= t.maxDownloads ? 'exhausted' : 'ready';

/** Orders placed with this reader's email (case-insensitive), newest first. */
export async function readerOrders(reader: Pick<Reader, 'email'>): Promise<MeOrder[]> {
  if (!reader.email) return [];
  const orders = await prisma.order.findMany({
    where: { customerEmail: { equals: reader.email, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  if (!orders.length) return [];
  const [catalog, tokens] = await Promise.all([
    products(),
    prisma.downloadToken.findMany({ where: { orderId: { in: orders.map(o => o.id) } }, orderBy: { createdAt: 'desc' } }),
  ]);
  return orders.map(o => {
    const p = catalog.find(x => x.id === o.productId);
    const t = tokens.find(x => x.orderId === o.id); // newest token for this order
    return {
      id: o.id, createdAt: o.createdAt.toISOString(), status: o.status, amount: o.amount, currency: o.currency,
      productId: o.productId, productTitle: o.productTitle, paymentProvider: o.paymentProvider,
      product: p ? { slug: p.slug, cover: p.cover || p.media?.find(m => m.kind === 'image')?.url || null, category: p.category, downloadable: p.category !== 'service' && !!p.fileUrl } : null,
      download: t ? { token: t.id, state: tokenState(t), expiresAt: t.expiresAt.toISOString(), left: Math.max(0, t.maxDownloads - t.downloadCount), max: t.maxDownloads } : null,
    };
  });
}

/**
 * Returns a usable download token for the reader's own paid order: the current one if it's still valid,
 * otherwise a fresh 48-hour token (same fields as fulfillOrder creates).
 */
export async function ensureDownloadToken(reader: Pick<Reader, 'email' | 'name'>, orderId: string): Promise<{ token: string } | { error: string; status: number }> {
  if (!reader.email) return { error: 'Your account has no email address', status: 400 };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerEmail.toLowerCase() !== reader.email.toLowerCase()) return { error: 'Order not found', status: 404 };
  if (order.status !== 'PAID') return { error: 'This order isn’t paid', status: 409 };

  const current = await prisma.downloadToken.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } });
  if (current && tokenState(current) === 'ready') return { token: current.id };

  const product = (await products()).find(p => p.id === order.productId);
  const fileUrl = product && product.category !== 'service' ? product.fileUrl || current?.fileUrl : current?.fileUrl;
  if (!fileUrl) return { error: 'This product has no file to download', status: 409 };

  const token = await prisma.downloadToken.create({
    data: {
      orderId, productId: order.productId, productTitle: order.productTitle,
      customerEmail: order.customerEmail, customerName: order.customerName,
      fileUrl, expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return { token: token.id };
}
