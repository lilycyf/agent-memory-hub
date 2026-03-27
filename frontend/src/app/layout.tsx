import type { Metadata } from "next";
import { Suspense } from "react";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Agent Memory Hub",
  description: "OpenRouter-style entity hub for exploring and comparing memory frameworks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="app-body">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Suspense fallback={<header className="site-header" style={{ minHeight: "var(--site-header-height)" }} />}>
          <AppNav />
        </Suspense>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <AppFooter />
        <Analytics />
      </body>
    </html>
  );
}
