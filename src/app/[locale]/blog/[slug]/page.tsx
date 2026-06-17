/**
 * Blog Post Page - Cloudflare Pages Deployment
 * 
 * This page uses Next.js dynamic routing with Cloudflare Pages native support.
 * Features:
 * - Server-side rendering for perfect SEO
 * - Dynamic metadata generation
 * - Automatic sitemap inclusion
 * - Edge caching for fast performance
 */
import BlogPostPageClient from './BlogPostPageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { env } from '@/lib/env';
import { locales } from '@/i18n/request';
import { BASE_URL, localePath, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogPost } from '@/types/blog';
import { fetchAllPublishedBlogLocalizedParams, getBlogSlugMap } from '@/lib/blog-static-params';

const buildFunctionsUrl = (path: string, params?: Record<string, string>) => {
  const base = new URL(env.SUPABASE_FUNCTIONS_URL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = base.pathname.replace(/\/$/, '');
  base.pathname = `${basePath}${normalizedPath}`;
  if (params) {
    const searchParams = new URLSearchParams(base.search);
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
    base.search = searchParams.toString();
  }
  return base.toString();
};

function articleTagsFromPhotoTopics(photoTopics: unknown): string[] {
  if (typeof photoTopics !== 'string') {
    return ['AI photography'];
  }

  const tags = photoTopics
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => (
      tag.length >= 2
      && tag.length <= 40
      && !/[*.:\n\r]/.test(tag)
      && !/\s{2,}/.test(tag)
    ))
    .slice(0, 8);

  return tags.length > 0 ? tags : ['AI photography'];
}

function slugsMatch(left: string, right: string): boolean {
  return decodeSlug(left) === decodeSlug(right);
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    
    // Fetch blog post data for metadata
    const response = await fetch(
      buildFunctionsUrl('/blog-post', { slug, locale }),
      { next: { revalidate: 3600 } }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          title: 'Blog Post Not Found',
          description: 'This AI photo guide is unavailable or has been moved.',
          robots: {
            index: false,
            follow: false,
          },
        };
      }

      throw new Error(`Failed to fetch /blog-post metadata for "${locale}/blog/${slug}" (status ${response.status}).`);
    }
    
    const post = await response.json();
    
    if (!post) {
      return {
        title: 'Blog Post Not Found',
        description: 'This AI photo guide is unavailable or has been moved.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    
    const title = post.title;
    const socialTitle = `${post.title} | My AI Photo Shoot`;
    const description = post.meta_description || post.title;
    const articleTags = articleTagsFromPhotoTopics(post.photo_topics);
    const slugMap = getBlogSlugMap(post, locales);
    if (!slugMap[locale]) {
      slugMap[locale] = slug;
    }
    const canonicalSlugForLocale = slugMap[locale] || slug;
    const isCanonicalSlug = slugsMatch(slug, canonicalSlugForLocale);
    const currentPath = `/blog/${canonicalSlugForLocale}/`;
    const languages = Object.fromEntries(
      Object.entries(slugMap).map(([language, localizedSlug]) => [
        language,
        localePath(language, `/blog/${localizedSlug}/`),
      ]),
    );
    languages['x-default'] = localePath('en', `/blog/${slugMap.en || slug}/`);
    const url = `${BASE_URL}${localePath(locale, currentPath)}`;
    const imageUrl = typeof post.featured_image_url === 'string'
      ? post.featured_image_url
      : 'https://myaiphotoshoot.com/og-image.png';

    // Infer MIME type from URL extension for better OG accuracy
    const inferMimeFromUrl = (url: string | null | undefined): string | null => {
      if (!url || typeof url !== 'string') return null;
      const lower = url.toLowerCase();
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.gif')) return 'image/gif';
      return null;
    };
    const ogImageType = inferMimeFromUrl(imageUrl);
    
    return {
      title,
      description,
      authors: [{ name: 'My AI Photo Shoot', url: 'https://myaiphotoshoot.com' }],
      creator: 'My AI Photo Shoot',
      publisher: 'My AI Photo Shoot',
      category: 'AI Photography',
      robots: {
        index: isCanonicalSlug,
        follow: true,
        googleBot: {
          index: isCanonicalSlug,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
      alternates: {
        canonical: url,
        languages,
      },
      openGraph: {
        title: socialTitle,
        description,
        url,
        siteName: 'My AI Photo Shoot',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
            ...(ogImageType ? { type: ogImageType } : {}),
          },
        ],
        locale: ogLocaleFromAppLocale(locale),
        alternateLocale: ogAlternateLocales(locales, locale),
        type: 'article',
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        section: 'AI Photography',
        tags: articleTags,
        authors: ['My AI Photo Shoot'],
      },
      twitter: {
        card: 'summary_large_image',
        title: socialTitle,
        description,
        images: [imageUrl],
      },
      // Enhanced for better indexing
      other: {
        'article:author': 'My AI Photo Shoot',
        'article:section': 'AI Photography',
        'og:image:alt': post.title,
        'twitter:image:alt': post.title,
      },
    };
  } catch (error) {
    console.error('Error generating blog post metadata:', error);
    throw error;
  }
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return fetchAllPublishedBlogLocalizedParams(
    buildFunctionsUrl,
    'Failed to fetch blog posts for localized pages',
    locales,
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;
  const res = await fetch(
    buildFunctionsUrl('/blog-post', { slug, locale }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error(`Failed to fetch /blog-post for "${locale}/blog/${slug}" (status ${res.status}).`);
  }
  const initialPost: unknown | null = await res.json();

  const content = (initialPost as BlogPost | null)?.content;
  if (!initialPost || typeof content !== 'string' || !content) {
    notFound();
  }

  return <BlogPostPageClient slug={slug} locale={locale} initialPost={(initialPost as BlogPost) || undefined} />;
}
