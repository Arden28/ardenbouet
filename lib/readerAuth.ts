// lib/readerAuth.ts — next-auth config for blog readers (comments, claps, highlights, bookmarks).
// Separate from the admin session (lib/adminSession.ts). JWT sessions; readers are upserted
// into the Reader table on sign-in, and the Reader id travels in the token.
import type { NextAuthOptions, Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export type ReaderSession = Session & {
  reader?: { id: string; name: string; image: string | null };
};

const providers: NextAuthOptions['providers'] = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(GitHubProvider({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET }));
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}
// Local testing without OAuth apps: `next dev` only, never in production builds.
if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      id: 'dev',
      name: 'Dev reader',
      credentials: { name: { label: 'Name', type: 'text' } },
      async authorize(creds) {
        const name = (creds?.name || 'Dev Reader').slice(0, 40);
        return { id: `dev-${name.toLowerCase().replace(/\W+/g, '-')}`, name, email: null, image: null };
      },
    }),
  );
}

export const readerProviderIds = providers.map(p => p.id);

export const readerAuthOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 60 },
  secret: process.env.NEXTAUTH_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS,
  pages: { signIn: '/blog' },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const reader = await prisma.reader.upsert({
          where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
          create: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            name: user.name || 'Reader',
            email: user.email ?? null,
            image: user.image ?? null,
          },
          update: { name: user.name || undefined, email: user.email ?? undefined, image: user.image ?? undefined },
        });
        token.readerId = reader.id;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as ReaderSession;
      if (token.readerId) {
        s.reader = { id: String(token.readerId), name: session.user?.name || 'Reader', image: session.user?.image ?? null };
      }
      return s;
    },
  },
};

/** The signed-in, non-banned reader for this request, or null. */
export async function getReader() {
  const session = (await getServerSession(readerAuthOptions)) as ReaderSession | null;
  const id = session?.reader?.id;
  if (!id) return null;
  const reader = await prisma.reader.findUnique({ where: { id } });
  return reader && !reader.banned ? reader : null;
}
