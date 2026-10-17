import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = 'https://ardenbouet.me'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static core pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/fr`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/fr/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/fr/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/fr/blog/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog/rss.xml`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/files/cv-v7.pdf`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // 2. Published blog posts (EN + FR when available)
  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        language: true,
      },
      orderBy: { publishedAt: 'desc' },
    })

    postRoutes = posts.map((post) => {
      const lastMod = new Date(post.publishedAt ?? post.updatedAt)
      // Prefer the language-specific path; fall back to both for safety
      const path =
        post.language === 'fr'
          ? `/fr/blog/${post.slug}`
          : `/blog/${post.slug}`

      return {
        url: `${BASE_URL}${path}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }
    })
  } catch (e) {
    console.error('Sitemap: failed to load posts', e)
  }

  // 3. Blog tags (derived from published posts)
  let tagRoutes: MetadataRoute.Sitemap = []
  try {
    const postsWithTags = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
    })

    const uniqueTags = Array.from(
      new Set(postsWithTags.flatMap((p) => p.tags ?? []))
    ).filter(Boolean)

    tagRoutes = uniqueTags.flatMap((tag) => [
      {
        url: `${BASE_URL}/blog/tag/${encodeURIComponent(tag)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      },
      {
        url: `${BASE_URL}/fr/blog/tag/${encodeURIComponent(tag)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      },
    ])
  } catch (e) {
    console.error('Sitemap: failed to load tags', e)
  }

  // 4. Series (if you want them indexed)
  let seriesRoutes: MetadataRoute.Sitemap = []
  try {
    const series = await prisma.series.findMany({
      select: { slug: true, updatedAt: true },
    })

    seriesRoutes = series.flatMap((s) => [
      {
        url: `${BASE_URL}/blog/series/${s.slug}`,
        lastModified: new Date(s.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      {
        url: `${BASE_URL}/fr/blog/series/${s.slug}`,
        lastModified: new Date(s.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ])
  } catch (e) {
    // Series routes may not exist yet – ignore
  }

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...seriesRoutes]
}