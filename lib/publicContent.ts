// lib/publicContent.ts — what of a product may reach a browser.
// The downloadable file URL and the promo codes stay on the server: files are delivered through
// /download/[token], and codes are checked one at a time by /api/checkout/promo.
import type { DiscountCode, ShopProduct } from '@/app/admin/types';

const PRIVATE_PRODUCT_FIELDS = ['fileUrl', 'discountCodes'] as const;

export type PublicProduct = Omit<ShopProduct, (typeof PRIVATE_PRODUCT_FIELDS)[number]> & {
  /** A file is delivered after payment (without revealing where it lives). */
  hasFile: boolean;
  /** At least one promo code exists (so the checkout shows the code field). */
  hasCodes: boolean;
};

export function publicProduct<T extends Record<string, unknown> | ShopProduct>(p: T): PublicProduct {
  const src = p as unknown as ShopProduct;
  const out = Object.fromEntries(Object.entries(src).filter(([k]) => !(PRIVATE_PRODUCT_FIELDS as readonly string[]).includes(k)));
  return { ...(out as Omit<ShopProduct, 'fileUrl' | 'discountCodes'>), hasFile: src.category !== 'service' && !!src.fileUrl, hasCodes: !!src.discountCodes?.length };
}

/** Finds a promo code on a product (case-insensitive). */
export function findCode(p: Pick<ShopProduct, 'discountCodes'>, code: string): DiscountCode | null {
  const c = code.trim().toUpperCase();
  return (c && p.discountCodes?.find(d => d.code.trim().toUpperCase() === c)) || null;
}
