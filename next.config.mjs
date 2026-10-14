/** @type {import('next').NextConfig} */
const nextConfig = {
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
