import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
  description: "Transform your selfies into professional, AI-enhanced photos with My AI Photo Shoot. Create thousands of unique, stunning images perfect for social media and professional use.",
  keywords: ["AI photo shoot", "selfie transformation", "AI photography", "professional photos", "AI portraits", "photo generation", "AI image enhancement"],
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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
