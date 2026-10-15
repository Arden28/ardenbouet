// app/admin/blog/layout.tsx — loads the story serif for the blog admin + editor.
import { Source_Serif_4 } from 'next/font/google';

const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

export const metadata = { title: 'Blog · Admin' };

export default function BlogAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={serif.variable}>{children}</div>;
}
