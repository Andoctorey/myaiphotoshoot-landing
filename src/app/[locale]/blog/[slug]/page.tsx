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
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogPost } from '@/types/blog';

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
      return {
        title: 'Blog Post Not Found - My AI Photo Shoot',
        description: 'The requested blog post could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    
    const post = await response.json();
    
    if (!post) {
      return {
        title: 'Blog Post Not Found - My AI Photo Shoot',
        description: 'The requested blog post could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    
    const title = `${post.title} | My AI Photo Shoot`;
    const description = post.meta_description || post.title;
    const url = canonicalUrl(locale, `/blog/${slug}/`);
    const imageUrl = post.featured_image_url || 'https://myaiphotoshoot.com/og-image.png';

    // Infer MIME type from URL extension for better OG accuracy
    const inferMimeFromUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;
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
      alternates: buildAlternates(locale, `/blog/${slug}/`, locales),
      openGraph: {
        title,
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
        tags: post.photo_topics?.split(',').map((tag: string) => tag.trim()) || [],
        authors: ['My AI Photo Shoot'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      // Enhanced for better indexing
      other: {
        'article:author': 'My AI Photo Shoot',
        'article:section': 'AI Photography',
        'article:tag': post.photo_topics || 'AI photography',
        'og:image:alt': post.title,
        'twitter:image:alt': post.title,
      },
    };
  } catch (error) {
    console.error('Error generating blog post metadata:', error);
    return {
      title: 'Blog Post - My AI Photo Shoot',
      description: 'Read our latest blog post about AI photography and photo generation.',
    };
  }
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  try {
    const allParams: { slug: string; locale: string }[] = [];
    const response = await fetch(
      buildFunctionsUrl('/blog-posts', { sitemap: '1' }),
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.warn('Failed to fetch blog posts for sitemap:', response.status);
      return allParams;
    }

    const data = await response.json();
    const posts = data.posts || [];

    for (const locale of locales) {
      posts.forEach((post: { slug?: string | null }) => {
        if (post.slug) {
          allParams.push({ slug: post.slug, locale });
        }
      });
    }
    
    return allParams;
    
  } catch (error) {
    console.error('Error generating static params for blog posts:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;
  // Fetch post at build time to pre-render content (no loading flash)
  let initialPost: unknown | null = null;
  const res = await fetch(
    buildFunctionsUrl('/blog-post', { slug, locale }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    notFound();
  }
  initialPost = await res.json();

  const content = (initialPost as BlogPost | null)?.content;
  if (!initialPost || typeof content !== 'string' || !content) {
    notFound();
  }

  return <BlogPostPageClient slug={slug} locale={locale} initialPost={(initialPost as BlogPost) || undefined} />;
}