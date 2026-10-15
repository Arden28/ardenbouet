/** @type {import('next').NextConfig} */
const nextConfig = {
    // Separate build output (e.g. a local production build next to `next dev`).
    distDir: process.env.NEXT_DIST_DIR || '.next',
    // output: 'export',
    images: { unoptimized: true },
    async redirects() {
        return [
            // Notes became the blog; posts kept their slugs.
            { source: '/notes', destination: '/blog', permanent: true },
            { source: '/notes/:slug', destination: '/blog/:slug', permanent: true },
            { source: '/rss.xml', destination: '/blog/rss.xml', permanent: true },
        ];
    },
};

export default nextConfig;
