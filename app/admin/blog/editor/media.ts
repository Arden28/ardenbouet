'use client';
// How the story editor gets images. Admins pick from (and upload into) the R2 media library;
// writers get an upload-only adapter (their own folder). Commands/node views read it from
// editor.storage, React panels from context.
import { createContext, useContext } from 'react';
import { Extension, type Editor } from '@tiptap/core';
import { openMediaPicker } from '@/components/admin/media/MediaPicker';
import { pickFiles, uploadToR2 } from './upload';

export type EditorMedia = {
  /** Let the author choose image(s); resolves with URLs ([] when cancelled). */
  pickImages: (multiple: boolean) => Promise<string[]>;
  /** Upload a pasted/dropped file and return its public URL. */
  upload: (file: File) => Promise<string>;
};

export const adminMedia: EditorMedia = {
  pickImages: async multiple =>
    (await openMediaPicker({ accept: 'image/*', multiple, initialPrefix: 'media/blog/', title: multiple ? 'Choose images' : 'Choose an image' }))?.map(i => i.url) ?? [],
  upload: file => uploadToR2(file, 'blog'),
};

/** Upload-only adapter for non-admin writers (endpoint scoped to their own folder). */
export function writerMedia(endpoint: string): EditorMedia {
  const upload = async (file: File) => {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    const put = await fetch(data.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
    return data.publicUrl as string;
  };
  return {
    upload,
    pickImages: async multiple => {
      const files = await pickFiles('image/*', multiple);
      return Promise.all(files.map(upload));
    },
  };
}

export const MediaAdapter = Extension.create<{ media: EditorMedia }, { media: EditorMedia }>({
  name: 'mediaAdapter',
  addOptions() { return { media: adminMedia }; },
  addStorage() { return { media: this.options.media }; },
});

export function getMedia(editor: Editor): EditorMedia {
  return (editor.storage as { mediaAdapter?: { media: EditorMedia } }).mediaAdapter?.media ?? adminMedia;
}

export const EditorMediaContext = createContext<EditorMedia>(adminMedia);
export const useEditorMedia = () => useContext(EditorMediaContext);
