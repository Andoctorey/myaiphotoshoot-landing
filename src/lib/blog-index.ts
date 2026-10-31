import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { locales } from '@/i18n/request';
import { buildFunctionsUrl } from '@/lib/functions-url';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogListItem, BlogPostsResponse } from '@/types/blog';
import {
  fetchAllPublishedBlogPosts,
  getBlogSlugForLocale,
  localizeBlogListItemSlugs,
  projectBlogListItems,
} from '@/lib/blog-static-params';

export function buildBlogIndexMetadata(locale: string, messages: unknown) {
  const url = canonicalUrl(locale, '/blog/');
  type BlogI18n = { blog?: { title?: string; description?: string } };
  const m = messages as BlogI18n;
  const blogTitle = typeof m.blog?.title === 'string'
    ? m.blog.title
    : 'AI Photo Blog';
  const socialTitle = `${blogTitle} | My AI Photoshoot`;
  const description = typeof m.blog?.description === 'string'
    ? m.blog.description
    : 'Practical tips, tutorials, and ideas for better AI portraits, prompts, and digital image workflows.';

  return {
    title: blogTitle,
    description,
    alternates: buildAlternates(locale, '/blog/', locales),
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
      title: socialTitle,
      description,
      url,
      siteName: 'My AI Photoshoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
      images: [{ url: '/og-image-v2.jpg?v=8', width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: '/og-image-v2.jpg?v=8', alt: socialTitle }],
    },
  } satisfies Metadata;
}

export async function fetchBlogIndexData(locale: string, { localized = false } = {}) {
  let initialPosts: BlogListItem[] = [];
  let initialPagination: { total: number; page: number; limit: number; totalPages: number } | null = null;
  let archivePosts: Array<{ slug: string; title: string }> = [];

  try {
    const [postsResult, archiveResult] = await Promise.allSettled([
      fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=12&locale=${locale}&platform=web`,
        { next: { revalidate: 3600 } }
      ),
      fetchAllPublishedBlogPosts(
        buildFunctionsUrl,
        `Failed to fetch blog archive posts for locale ${locale}`,
      ),
    ]);
    const res = postsResult.status === 'fulfilled' ? postsResult.value : null;
    if (res?.ok) {
      const json = (await res.json()) as BlogPostsResponse;
      initialPosts = projectBlogListItems(json.posts);
      initialPagination = {
        total: json.total,
        page: json.page,
        limit: json.limit,
        totalPages: json.totalPages,
      };
    }
    const allPosts = archiveResult.status === 'fulfilled' ? archiveResult.value : [];
    if (localized) initialPosts = localizeBlogListItemSlugs(initialPosts, allPosts, locale);
    archivePosts = allPosts
      .map((post) => {
        const slug = getBlogSlugForLocale(post, locale);
        return slug ? { slug, title: (localized ? post.translations?.[locale]?.title?.trim() : '') || post.title?.trim() || post.slug } : null;
      })
      .filter((post): post is { slug: string; title: string } => post !== null);
  } catch {
    // Non-fatal: fall back to client fetch
  }

  return { initialPosts, initialPagination: initialPagination || undefined, archivePosts };
}
