// lib/blog/embeds.ts — turns a pasted URL into a safe iframe source.
// Only allow-listed providers get an iframe; anything else renders as a link card.

export type ResolvedEmbed = {
  provider: string;
  src: string;
  /** width / height; null = fixed height */
  aspect: number | null;
  height?: number;
};

function parse(url: string): URL | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

export function resolveEmbed(raw: string): ResolvedEmbed | null {
  const u = parse(raw);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const path = u.pathname;

  // YouTube
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') id = path.slice(1);
    else if (path.startsWith('/watch')) id = u.searchParams.get('v') ?? '';
    else if (/^\/(embed|shorts|live)\//.test(path)) id = path.split('/')[2] ?? '';
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    const start = u.searchParams.get('t') ?? u.searchParams.get('start');
    const qs = start ? `?start=${parseInt(start, 10) || 0}` : '';
    return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}${qs}`, aspect: 16 / 9 };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = path.split('/').filter(Boolean).find(s => /^\d+$/.test(s));
    if (!id) return null;
    return { provider: 'vimeo', src: `https://player.vimeo.com/video/${id}?dnt=1`, aspect: 16 / 9 };
  }

  // Loom
  if (host === 'loom.com') {
    const id = path.match(/\/(?:share|embed)\/([a-f0-9]{16,})/)?.[1];
    if (!id) return null;
    return { provider: 'loom', src: `https://www.loom.com/embed/${id}`, aspect: 16 / 9 };
  }

  // CodePen
  if (host === 'codepen.io') {
    const m = path.match(/^\/([\w-]+)\/(?:pen|embed)\/([\w-]+)/);
    if (!m) return null;
    return {
      provider: 'codepen',
      src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`,
      aspect: null,
      height: 420,
    };
  }

  // CodeSandbox
  if (host === 'codesandbox.io') {
    const id = path.match(/^\/(?:s|embed|p\/sandbox)\/([\w-]+)/)?.[1];
    if (!id) return null;
    return { provider: 'codesandbox', src: `https://codesandbox.io/embed/${id}`, aspect: null, height: 500 };
  }

  // Figma
  if (host === 'figma.com' && /^\/(file|design|proto|board)\//.test(path)) {
    return {
      provider: 'figma',
      src: `https://www.figma.com/embed?embed_host=ardenbouet&url=${encodeURIComponent(u.toString())}`,
      aspect: 16 / 10,
    };
  }

  // Spotify
  if (host === 'open.spotify.com') {
    const m = path.match(/^\/(track|album|playlist|episode|show)\/(\w+)/);
    if (!m) return null;
    return {
      provider: 'spotify',
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      aspect: null,
      height: m[1] === 'track' || m[1] === 'episode' ? 152 : 352,
    };
  }

  return null;
}

export function displayHost(raw: string): string {
  const u = parse(raw);
  return u ? u.hostname.replace(/^www\./, '') : raw;
}

export function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string') return false;
  if (href.startsWith('/') || href.startsWith('#')) return !href.startsWith('//');
  return /^(https?:|mailto:)/i.test(href.trim());
}
