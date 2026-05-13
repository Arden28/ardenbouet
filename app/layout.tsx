import type { Metadata } from "next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arden BOUET · Portfolio",
  description: "Full-stack Web developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
      <body>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
