import BlogPageClient from '../[locale]/blog/BlogPageClient';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { env } from '@/lib/env';
import { locales, defaultLocale } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogListItem, BlogPostsResponse } from '@/types/blog';
import { loadMessages } from '@/lib/i18n-messages';

// SEO metadata for the default-locale blog listing page
export async function generateMetadata(): Promise<Metadata> {
  try {
    const url = canonicalUrl(defaultLocale, '/blog/');
    const messages = await loadMessages(defaultLocale);
    type BlogI18n = { blog?: { title?: string; description?: string } };
    const m = messages as BlogI18n;
    const blogTitle = typeof m.blog?.title === 'string'
      ? m.blog.title as string
      : 'AI Photo Blog';
    const title = `${blogTitle} | My AI Photo Shoot`;
    const description = typeof m.blog?.description === 'string'
      ? m.blog.description as string
      : 'Discover the latest tips, tutorials, and insights about AI photography and digital art creation.';

    return {
      title,
      description,
      alternates: buildAlternates(defaultLocale, '/blog/', locales),
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
        locale: ogLocaleFromAppLocale(defaultLocale),
        alternateLocale: ogAlternateLocales(locales, defaultLocale),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return {
      title: 'AI Photo Blog | My AI Photo Shoot',
      description: 'Discover tips and tutorials about AI photography and digital art.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage() {
  let initialPosts: BlogListItem[] = [];
  let initialPagination: { total: number; page: number; limit: number; totalPages: number } | null = null;

  try {
    const res = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=10&locale=${defaultLocale}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = (await res.json()) as BlogPostsResponse;
      initialPosts = json.posts || [];
      initialPagination = {
        total: json.total,
        page: json.page,
        limit: json.limit,
        totalPages: json.totalPages,
      };
    }
  } catch {
    // Non-fatal: fall back to client fetch
  }

  const messages = await loadMessages(defaultLocale);

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <BlogPageClient
        locale={defaultLocale}
        initialPosts={initialPosts}
        initialPagination={initialPagination || undefined}
      />
    </NextIntlClientProvider>
  );
}