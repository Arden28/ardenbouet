// app/api/auth/[...nextauth]/route.ts — blog reader sign-in (see lib/readerAuth.ts)
import NextAuth from 'next-auth';
import { readerAuthOptions } from '@/lib/readerAuth';

const handler = NextAuth(readerAuthOptions);
export { handler as GET, handler as POST };
