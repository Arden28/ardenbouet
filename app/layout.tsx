import type { Metadata } from "next";
import { Suspense } from "react";
import { Source_Serif_4 } from "next/font/google";
import { I18nProvider } from "./I18nProvider";
import { SiteProviders } from "@/components/site/SiteProviders";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLocale } from "@/lib/serverT";
import { isAdminRequest } from "@/lib/apiUtil";
import { readerProviderIds } from "@/lib/readerAuth";
import "./globals.css";
import "./blog/story.css";
import "./dark.css";
import { themeInitScript } from "@/lib/theme";

const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const BASE_URL = "https://ardenbouet.me";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Arden BOUET · Software Engineer",
    template: "%s · Arden BOUET",
  },
  description:
    "Software engineer building mobility, travel and SaaS platforms. Writing, templates, and projects.",
  keywords: [
    "Arden Bouet",
    "Software Engineer",
    "Full-stack Developer",
    "SaaS",
    "Mobility",
    "Travel tech",
  ],
  authors: [{ name: "Arden Bouet", url: BASE_URL }],
  creator: "Arden Bouet",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_FR"],
    url: BASE_URL,
    siteName: "Arden Bouet",
    title: "Arden BOUET · Software Engineer",
    description:
      "Software engineer building mobility, travel and SaaS platforms.",
    images: [
      {
        url: "/images/me.png", // or a proper OG image 1200×630
        width: 1200,
        height: 630,
        alt: "Arden Bouet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arden BOUET · Software Engineer",
    description:
      "Software engineer building mobility, travel and SaaS platforms.",
    images: ["/images/me.png"],
    // creator: "@yourhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: BASE_URL,
      fr: `${BASE_URL}/fr`,
    },
  },
};

function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Arden Bouet",
        description:
          "Software engineer building mobility, travel and SaaS platforms.",
        publisher: { "@id": `${BASE_URL}/#person` },
        inLanguage: ["en", "fr"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Person",
        "@id": `${BASE_URL}/#person`,
        name: "Arden Bouet",
        url: BASE_URL,
        jobTitle: "Software Engineer",
        description:
          "Full-stack software developer focused on mobility, travel and SaaS platforms.",
        sameAs: [
          // Add the ones you actually use
          "https://github.com/Arden28",
          "https://x.com/ardenbouet",
          "https://www.linkedin.com/in/arden-bouet",
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  const isAdmin = await isAdminRequest();

  return (
    <html lang={locale} className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="icon" href="/images/me.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <WebsiteJsonLd />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          window.addEventListener('error', function(e) {
            var msg = e.message || '';
            if (msg.includes('ChunkLoad') || msg.includes('Loading chunk')) {
              if (!sessionStorage.getItem('_chunk_reload')) {
                sessionStorage.setItem('_chunk_reload', '1');
                window.location.reload();
              }
            }
          });
          window.addEventListener('load', function() {
            sessionStorage.removeItem('_chunk_reload');
          });
        `,
          }}
        />
      </head>

      <body className="bg-white">
        <I18nProvider locale={locale}>
          <SiteProviders
            locale={locale}
            isAdmin={isAdmin}
            providers={readerProviderIds}
          >
            <Suspense fallback={<div className="h-[60px]" />}>
              <SiteHeader />
            </Suspense>
            {children}
            <SiteFooter />
          </SiteProviders>
        </I18nProvider>
      </body>
    </html>
  );
}