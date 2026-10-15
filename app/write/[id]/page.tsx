'use client';
// /write/[id] — the story editor for writers (same editor as the admin, scoped to /api/me).
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import StoryEditor from '@/app/admin/blog/editor/StoryEditor';
import { writerEnv } from '@/app/admin/blog/editor/env';
import { writerMedia } from '@/app/admin/blog/editor/media';
import { useSite } from '@/components/site/SiteProviders';
import '@/app/blog/story.css';

export default function WriteStoryPage({ params }: { params: { id: string } }) {
  const { me, href } = useSite();
  const env = useMemo(
    () => me && writerEnv({ canPublish: me.writer.canPublish, donationsReady: me.reader.stripeChargesEnabled, homeHref: href('/me/stories') }),
    [me, href],
  );
  const media = useMemo(() => writerMedia('/api/me/upload'), []);
  if (!env) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>;
  return <StoryEditor id={params.id} env={env} media={media} />;
}
