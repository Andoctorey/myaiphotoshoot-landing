/* eslint-disable @next/next/google-font-preconnect */
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DirectionHandler from "@/components/layout/DirectionHandler";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import ConsentBanner from "@/components/ConsentBanner";
import { env } from "@/lib/env";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://myaiphotoshoot.com"),
  title: {
    default: "My AI Photo Shoot – AI Photo Generator",
    template: "%s | My AI Photo Shoot",
  },
  description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
  authors: [{ name: "My AI Photo Shoot" }],
  creator: "My AI Photo Shoot",
  publisher: "My AI Photo Shoot",
  manifest: "/site.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/images/favicon.webp', type: 'image/webp' },
      { url: '/images/favicon.png', type: 'image/png' },
      { url: '/images/icon_16.webp', sizes: '16x16', type: 'image/webp' },
      { url: '/images/icon_16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icon_32.webp', sizes: '32x32', type: 'image/webp' },
      { url: '/images/icon_32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/icon_120.png', sizes: '120x120', type: 'image/png' },
      { url: '/images/icon_192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/icon_512.png', sizes: '512x512', type: 'image/png' },
    ],
    // Use PNG as canonical Apple touch icon to avoid duplicates and ensure compatibility
    apple: [
      { url: '/images/icon_180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI-Generated Portraits",
    description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
    url: "https://myaiphotoshoot.com",
    siteName: "My AI Photo Shoot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "My AI Photo Shoot - Transform your selfies with AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI-Generated Portraits",
    description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
    images: ["/og-image.png"],
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
};

// Resolve Supabase Functions origin for preconnect/dns-prefetch
const supabaseFunctionsOrigin = (() => {
  try {
    return new URL(env.SUPABASE_FUNCTIONS_URL).origin;
  } catch {
    return undefined;
  }
})();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="My AI Photo Shoot" />
        <meta name="apple-mobile-web-app-title" content="My AI Photo Shoot" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* iOS Smart App Banner */}
        <meta
          name="apple-itunes-app"
          content="app-id=6744860178, app-argument=https://myaiphotoshoot.com/"
        />
        {/* Android App Indexing (legacy hint; primary is Digital Asset Links) */}
        <link
          rel="alternate"
          href="android-app://com.myaiphotoshoot/https/myaiphotoshoot.com/"
        />
        {/* App Links metadata for deep-link discovery in social/other apps */}
        <meta property="al:web:url" content="https://myaiphotoshoot.com/" />
        <meta property="al:web:should_fallback" content="true" />
        <meta property="al:android:package" content="com.myaiphotoshoot" />
        <meta property="al:android:app_name" content="My AI Photo Shoot" />
        <meta property="al:ios:app_store_id" content="6744860178" />
        <meta property="al:ios:app_name" content="My AI Photo Shoot" />
        <link rel="alternate" type="application/rss+xml" title="My AI Photo Shoot Blog" href="/rss.xml" />
        {/* Performance: preconnect/dns-prefetch for Google Fonts (defensive even with next/font) */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {supabaseFunctionsOrigin && (
          <>
            <link rel="preconnect" href={supabaseFunctionsOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseFunctionsOrigin} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://myaiphotoshoot.com/#organization',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://myaiphotoshoot.com/images/icon_512.png',
                width: 512,
                height: 512
              },
              sameAs: [
                'https://x.com/andoctorey',
                'https://github.com/Andoctorey/myaiphotoshoot-kmp',
                'https://apps.apple.com/app/id6744860178',
                'https://play.google.com/store/apps/details?id=com.myaiphotoshoot'
              ],
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  contactType: 'customer support',
                  email: 'support@myaiphotoshoot.com',
                  availableLanguage: ['en']
                }
              ],
              areaServed: 'Worldwide'
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://myaiphotoshoot.com/#website',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com',
              publisher: {
                '@type': 'Organization',
                name: 'My AI Photo Shoot',
                url: 'https://myaiphotoshoot.com',
                '@id': 'https://myaiphotoshoot.com/#organization'
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        <DirectionHandler />
        <ErrorBoundary>
          <ThemeProvider>{children}</ThemeProvider>
        </ErrorBoundary>
        <ConsentBanner />
      </body>
    </html>
  );
}
