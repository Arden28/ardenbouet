// app/blog/layout.tsx — blog-only styles. Header, footer, session and sign-in come from the root layout.
import './story.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="blog-ui min-h-screen bg-white">{children}</div>;
}
