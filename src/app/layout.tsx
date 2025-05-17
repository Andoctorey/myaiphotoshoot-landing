import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://myaiphotoshoot.com"),
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
  description: "Transform your selfies into professional, AI-enhanced photos with My AI Photo Shoot. Create thousands of unique, stunning images perfect for social media and professional use.",
  keywords: ["AI photo shoot", "selfie transformation", "AI photography", "professional photos", "AI portraits", "photo generation", "AI image enhancement"],
  icons: {
    icon: [
      { url: '/images/favicon.png' },
      { url: '/images/icon_16.png', sizes: '16x16' },
      { url: '/images/icon_32.png', sizes: '32x32' },
    ],
    apple: [
      { url: '/images/icon_180.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/images/icon_180.png',
      },
    ],
  },
  openGraph: {
    title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
    description: "Transform your selfies into professional, AI-enhanced photos with My AI Photo Shoot. Create thousands of unique, stunning images perfect for social media and professional use.",
    url: "https://myaiphotoshoot.com",
    siteName: "My AI Photo Shoot",
    images: [
      {
        url: "/og-image.jpg",
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
    title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
    description: "Transform your selfies into professional, AI-enhanced photos with My AI Photo Shoot. Create thousands of unique, stunning images perfect for social media and professional use.",
    images: ["/og-image.jpg"],
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
  verification: {
    google: "your-google-verification-code", // You'll need to replace this with your actual Google verification code
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
        <link rel="icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon_180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon_32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon_16.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
