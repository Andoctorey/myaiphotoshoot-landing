import BlogPageClient from './BlogPageClient';
import type { Metadata } from 'next';
import { locales, defaultLocale } from '@/i18n/request';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// SEO metadata for the blog listing page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale } = await params;

    const baseUrl = 'https://myaiphotoshoot.com';
    const url = `${baseUrl}/${locale}/blog`;
    const title = `AI Photo Blog | My AI Photo Shoot`;
    const description = 'Discover the latest tips, tutorials, and insights about AI photography and digital art creation.';

    // Build hreflang alternates, include x-default
    const languageAlternates: Record<string, string> = Object.fromEntries(
      (locales as readonly string[]).map(l => [l, `/${l}/blog`])
    );
    languageAlternates['x-default'] = `/${defaultLocale}/blog`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: languageAlternates,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'My AI Photo Shoot',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    // Never throw in metadata; return safe defaults
    return {
      title: 'AI Photo Blog | My AI Photo Shoot',
      description: 'Discover tips and tutorials about AI photography and digital art.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  return <BlogPageClient locale={locale} />;
} 