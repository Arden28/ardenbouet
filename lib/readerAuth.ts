// lib/readerAuth.ts — next-auth config for blog readers (comments, claps, highlights, bookmarks).
// Separate from the admin session (lib/adminSession.ts). JWT sessions; readers are upserted
// into the Reader table on sign-in, and the Reader id travels in the token.
import type { NextAuthOptions, Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import DiscordProvider from 'next-auth/providers/discord';
import TwitterProvider from 'next-auth/providers/twitter';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { uniqueHandle } from '@/lib/accounts';

export type ReaderSession = Session & {
  reader?: { id: string; name: string; image: string | null };
};

const providers: NextAuthOptions['providers'] = [];

// Each provider is enabled only when its OAuth app credentials are set. Order = button order.
// Values are trimmed and unquoted: a secret pasted into a hosting dashboard as `"abc…"` (copied from a .env
// file) otherwise reaches the provider with the quotes, which fails the token exchange as OAuthCallback.
const clean = (v: string | undefined) => v?.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').trim() || undefined;
const env = new Proxy(process.env, { get: (target, key: string) => clean(target[key]) }) as Record<string, string | undefined>;
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }));
}
if (env.GITHUB_ID && env.GITHUB_SECRET) {
  providers.push(GitHubProvider({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }));
}
if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  // "Sign In with LinkedIn using OpenID Connect" (the legacy r_liteprofile API is retired).
  providers.push(LinkedInProvider({
    clientId: env.LINKEDIN_CLIENT_ID,
    clientSecret: env.LINKEDIN_CLIENT_SECRET,
    authorization: { params: { scope: 'openid profile email' } },
    issuer: 'https://www.linkedin.com/oauth',
    wellKnown: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
    jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
    profile: p => ({ id: p.sub, name: p.name, email: p.email, image: p.picture }),
  }));
}
if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) {
  providers.push(DiscordProvider({ clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET }));
}
if (env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET) {
  providers.push(TwitterProvider({ clientId: env.TWITTER_CLIENT_ID, clientSecret: env.TWITTER_CLIENT_SECRET, version: '2.0' }));
}
if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  providers.push(FacebookProvider({ clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET }));
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

// Credentials providers report id 'credentials' at the top level; the configured id lives in options.
export const readerProviderIds = providers.map(p => (p as { options?: { id?: string } }).options?.id ?? p.id);

export const readerAuthOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 60 },
  secret: process.env.NEXTAUTH_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS,
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    // Banned readers can't sign back in (next-auth shows ?error=AccessDenied on /signin).
    async signIn({ account }) {
      if (!account) return true;
      const existing = await prisma.reader.findUnique({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        select: { banned: true },
      });
      return !existing?.banned;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        const reader = await prisma.reader.upsert({
          where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
          create: {
            handle: await uniqueHandle(user.name || user.email?.split('@')[0] || 'reader'),
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
