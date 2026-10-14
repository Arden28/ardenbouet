'use client';
// Where the story editor talks to, and what it's allowed to show. The admin edits any story
// through /api/admin/blog; writers edit their own (or assigned) stories through /api/me.
import { createContext, useContext } from 'react';

export type EditorEnv = {
  role: 'admin' | 'writer';
  /** Base for GET/PUT/DELETE /{id} and /{id}/revisions */
  postsApi: string;
  embeddablesApi: string;
  /** Where "back" and "deleted" go */
  homeHref: string;
  /** Writers without direct publishing submit for review */
  canPublish: boolean;
  /** Writer has a Stripe account able to receive donations (admin: platform Stripe) */
  donationsReady: boolean;
};

export const ADMIN_ENV: EditorEnv = {
  role: 'admin',
  postsApi: '/api/admin/blog/posts',
  embeddablesApi: '/api/admin/blog/embeddables',
  homeHref: '/admin/blog',
  canPublish: true,
  donationsReady: true,
};

export function writerEnv(opts: { canPublish: boolean; donationsReady: boolean; homeHref?: string }): EditorEnv {
  return {
    role: 'writer',
    postsApi: '/api/me/posts',
    embeddablesApi: '/api/me/embeddables',
    homeHref: opts.homeHref ?? '/me/stories',
    canPublish: opts.canPublish,
    donationsReady: opts.donationsReady,
  };
}

export const EditorEnvContext = createContext<EditorEnv>(ADMIN_ENV);
export const useEditorEnv = () => useContext(EditorEnvContext);
