'use client';
// /admin/blog/new — creates an empty draft and opens it in the editor.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewStoryPage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev — don't create two drafts
    started.current = true;
    fetch('/api/admin/blog/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(async r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(d => router.replace(`/admin/blog/${d.post.id}`))
      .catch(e => setError(e.message));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center font-sans text-[#6b6b6b]">
      {error ? <p>Could not create a draft: {error}</p> : <Loader2 className="h-6 w-6 animate-spin" />}
    </div>
  );
}
