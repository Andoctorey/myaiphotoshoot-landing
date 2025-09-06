import type { Metadata } from "next";
import "../globals.css";
import { locales } from "@/i18n/request";
import { NextIntlClientProvider } from 'next-intl';
import { RTL_LANGUAGES } from '@/lib/utils';
import HtmlLang from '@/components/layout/HtmlLang';

export const metadata: Metadata = {
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
  description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
  keywords: ["AI photo shoot", "selfie transformation", "AI-generated photos", "professional photography", "portrait enhancement", "creative photo prompts", "affordable AI photos", "privacy-focused photo app", "Flux.1 AI", "photo editing app"],
    manifest: "/site.webmanifest",
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
    messages = (await import(`../../../messages/en/index.json`)).default;
  }

  const isRTL = RTL_LANGUAGES.includes(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang locale={locale} dir={isRTL ? 'rtl' : 'ltr'} />
      <div>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}