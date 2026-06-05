import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;

  const record = await prisma.downloadToken.findUnique({ where: { id: token } });

  if (!record) {
    return NextResponse.redirect(new URL(`/download/${token}?state=invalid`, req.url));
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/download/${token}?state=expired`, req.url));
  }

  if (record.downloadCount >= record.maxDownloads) {
    return NextResponse.redirect(new URL(`/download/${token}?state=exhausted`, req.url));
  }

  await prisma.downloadToken.update({
    where: { id: token },
    data: { downloadCount: { increment: 1 } },
  });

  // Proxy the file through the server so the R2/CDN URL never reaches the browser.
  const upstream = await fetch(record.fileUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: 'File temporarily unavailable' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const safeName    = record.productTitle.replace(/[^a-z0-9.\-_]/gi, '_');
  const disposition = `attachment; filename="${safeName}.zip"`;

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': disposition,
      'Cache-Control':       'no-store, no-cache',
      'X-Robots-Tag':        'noindex',
    },
  });
}
