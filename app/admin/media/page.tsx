'use client';
// /admin/media — the Cloudflare R2 file manager
import { AdminShell } from '@/components/admin/AdminShell';
import MediaLibrary from '@/components/admin/media/MediaLibrary';
import '@/app/blog/story.css';

export default function MediaPage() {
  return (
    <AdminShell title="Media library" flush>
      <div className="h-[calc(100vh-64px)]">
        <MediaLibrary />
      </div>
    </AdminShell>
  );
}
