// app/api/content/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export async function GET() {
  const row = await prisma.content.findUnique({ where: { id: 1 } });
  return NextResponse.json(row?.data ?? { projects: [], experiences: [], journey: [], notes: [] });
}