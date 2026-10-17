// components/JsonLd.tsx
export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://ardenbouet.me/#website',
        url: 'https://ardenbouet.me',
        name: 'Arden Bouet',
        description: 'Software engineer, writer, and builder.',
        publisher: { '@id': 'https://ardenbouet.me/#person' },
        inLanguage: ['en', 'fr'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://ardenbouet.me/blog?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Person',
        '@id': 'https://ardenbouet.me/#person',
        name: 'Arden Bouet',
        url: 'https://ardenbouet.me',
        sameAs: [
          // add your real profiles
          'https://github.com/Arden28',
          'https://x.com/ardenbouet',
          'https://www.linkedin.com/in/arden-bouet/',
        ],
        jobTitle: 'Software engineer',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}