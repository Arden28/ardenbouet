// POST /api/contact { name, email, services[], budget (1-5), message, website? } — stores a Message
// (the Prisma model that existed but was never written to) and emails the owner.
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { notifyOwner } from '@/lib/notify';

export const dynamic = 'force-dynamic';
const BUDGETS = ['LOW', 'MEDIUM', 'HIGH', 'PREMIUM', 'ENTERPRISE'] as const;
const BUDGET_LABEL = ['< $500', '$500 – 2k', '$2 – 8k', '$8 – 20k', '$20k +'];

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  if (str(body.website)) return json({ ok: true }); // honeypot
  const name = str(body.name, 80).trim();
  const email = str(body.email, 254).trim().toLowerCase();
  const message = str(body.message, 5000).trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Please enter your name and a valid email');
  if (message.length < 10) return err('Tell me a bit more about the project');
  const services = Array.isArray(body.services) ? body.services.map(s => String(s).slice(0, 40)).slice(0, 8) : [];
  const b = Math.min(5, Math.max(1, Math.round(Number(body.budget) || 0)));

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  const recent = ip ? await prisma.message.count({ where: { ip, createdAt: { gte: new Date(Date.now() - 3_600_000) } } }) : 0;
  if (recent >= 5) return err('Too many messages, please try again later', 429);

  await prisma.message.create({
    data: {
      name, email, services, body: message, budget: body.budget ? BUDGETS[b - 1] : null,
      ip, userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    },
  });
  await notifyOwner(`New message from ${name}`,
    `${name} <${email}>\n${services.length ? `Needs: ${services.join(', ')}\n` : ''}${body.budget ? `Budget: ${BUDGET_LABEL[b - 1]}\n` : ''}\n${message}`);
  return json({ ok: true }, 201);
}
