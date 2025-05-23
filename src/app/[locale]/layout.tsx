import type { Metadata } from "next";
import "../globals.css";
import { locales } from "@/i18n/request";
import { NextIntlClientProvider } from 'next-intl';

export const metadata: Metadata = {
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
  description: "Transform your selfies into professional, AI-enhanced photos with My AI Photo Shoot. Create thousands of unique, stunning images perfect for social media and professional use.",
  keywords: ["AI photo shoot", "selfie transformation", "AI photography", "professional photos", "AI portraits", "photo generation", "AI image enhancement"],
  icons: {
    icon: [
      { url: '/images/favicon.webp', type: 'image/webp' },
      { url: '/images/favicon.png', type: 'image/png' },
      { url: '/images/icon_16.webp', sizes: '16x16', type: 'image/webp' },
      { url: '/images/icon_16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icon_32.webp', sizes: '32x32', type: 'image/webp' },
      { url: '/images/icon_32.png', sizes: '32x32', type: 'image/png' },
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
  // The OpenGraph and Twitter metadata will be dynamically set based on the locale
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}/index.json`)).default;
  } catch {
    // Fallback to English if the locale doesn't exist
    messages = (await import(`../../../messages/en/index.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 