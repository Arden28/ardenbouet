// POST /api/me/writer-request — ask to become a writer
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireReader } from '@/lib/meApi';
import { notifyOwner } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  if (ctx.grant) return err('You already have writing access');
  const pending = await prisma.writerRequest.findFirst({ where: { readerId: ctx.reader.id, status: 'PENDING' } });
  if (pending) return err('Your request is already being reviewed');

  const body = await readJson(req);
  const message = str(body?.message, 2000).trim();
  if (message.length < 30) return err('Tell us a bit more about what you’d like to write (30+ characters)');
  const sampleUrl = str(body?.sampleUrl, 300).trim();
  if (sampleUrl && !/^https?:\/\//i.test(sampleUrl)) return err('Sample link must start with http(s)://');
  const topics = Array.isArray(body?.topics) ? body.topics.map(t => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean).slice(0, 5) : [];

  const request = await prisma.writerRequest.create({
    data: { readerId: ctx.reader.id, message, sampleUrl: sampleUrl || null, topics },
  });
  await notifyOwner(`New writer request from ${ctx.reader.name}`, `${ctx.reader.name} (@${ctx.reader.handle}) asked to write.\n\n${message}${sampleUrl ? `\n\nSample: ${sampleUrl}` : ''}`, '/admin/users?tab=requests');
  return json({ request: { status: request.status, createdAt: request.createdAt } }, 201);
}
