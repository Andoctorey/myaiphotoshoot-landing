import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DirectionHandler from "@/components/layout/DirectionHandler";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://myaiphotoshoot.com"),
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI-Generated Portraits",
  description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
  keywords: ["AI photo shoot", "selfie transformation", "AI-generated photos", "professional photography", "portrait enhancement", "creative photo prompts", "affordable AI photos", "privacy-focused photo app", "Flux.1 AI", "photo editing app"],
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
    apple: [
      { url: '/images/icon_180.webp', sizes: '180x180', type: 'image/webp' },
      { url: '/images/icon_180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/images/icon_180.webp',
        type: 'image/webp'
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/images/icon_180.png',
        type: 'image/png'
      },
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
    creator: "@myaiphotoshoot",
    site: "@myaiphotoshoot",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="My AI Photo Shoot" />
        <meta name="apple-mobile-web-app-title" content="My AI Photo Shoot" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="canonical" href="https://myaiphotoshoot.com" />
        <link rel="icon" href="/images/favicon.png" type="image/png" />
        <link rel="icon" href="/images/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon_180.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon_180.webp" type="image/webp" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon_32.png" />
        <link rel="icon" type="image/webp" sizes="32x32" href="/images/icon_32.webp" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon_16.png" />
        <link rel="icon" type="image/webp" sizes="16x16" href="/images/icon_16.webp" />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        <DirectionHandler />
        <ErrorBoundary>
          <ThemeProvider>{children}</ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
