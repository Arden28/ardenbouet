'use client';
// /write/new — creates a draft for the signed-in writer and opens it.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';

export default function NewWriterStory() {
  const router = useRouter();
  const { href } = useSite();
  const started = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch('/api/me/posts', { method: 'POST' })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `Error ${r.status}`); return d; })
      .then(d => router.replace(`/write/${d.post.id}`))
      .catch(e => setError(e.message));
  }, [router]);
  return (
    <div className="blog-ui flex min-h-screen flex-col items-center justify-center gap-4 text-[#6b6b6b]">
      {error ? <><p>{error}</p><a href={href('/me/stories')} className="rounded-full bg-[#242424] px-4 py-2 text-sm text-white">Back</a></> : <Loader2 className="h-6 w-6 animate-spin" />}
    </div>
  );
}
