// POST /api/me/upload { filename, contentType } — presigned image upload for writers,
// confined to media/writers/<readerId>/ in the R2 bucket.
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireWriter } from '@/lib/meApi';
import { getR2Config } from '@/lib/getR2Config';
import { createUploadPresignedUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';
const ALLOWED = /^image\/(png|jpe?g|gif|webp|avif)$/;

export async function POST(req: Request) {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx.error;
  const cfg = await getR2Config();
  if (!cfg) return err('Uploads are not available right now', 503);
  const body = await readJson(req);
  const contentType = str(body?.contentType, 60);
  if (!ALLOWED.test(contentType)) return err('Only PNG, JPEG, GIF, WebP or AVIF images can be uploaded');
  const filename = str(body?.filename, 120) || 'image';
  return json(await createUploadPresignedUrl(filename, contentType, cfg, `writers/${ctx.reader.id}/`));
}
