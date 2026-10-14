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

const serif = Source_Serif_4({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Arden BOUET · Software Engineer",
  description: "Software engineer building mobility, travel and SaaS platforms.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  const isAdmin = await isAdminRequest();
  return (
    <html lang={locale} className={serif.variable}>
      <head>
        <link rel="icon" href="/images/me.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
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
        ` }} />
      </head>

      <body className="bg-white">
        <I18nProvider locale={locale}>
          <SiteProviders locale={locale} isAdmin={isAdmin} providers={readerProviderIds}>
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
