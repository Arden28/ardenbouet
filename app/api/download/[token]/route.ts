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

  return NextResponse.redirect(record.fileUrl);
}
