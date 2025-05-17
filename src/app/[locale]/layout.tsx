import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { locales } from "@/i18n/request";
import { NextIntlClientProvider } from 'next-intl';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
  params: any;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as string;
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}/index.json`)).default;
  } catch (error) {
    // Fallback to English if the locale doesn't exist
    messages = (await import(`../../../messages/en/index.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 