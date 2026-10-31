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
import { buildBlogPostMetadata } from '@/lib/blog-post-metadata';
import { buildFunctionsUrl } from '@/lib/functions-url';
import BlogPostPageClient from './BlogPostPageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { defaultLocale, locales } from '@/i18n/request';
import {
  fetchAllPublishedBlogLocalizedParams,
  normalizeBlogRouteSlug,
} from '@/lib/blog-static-params';
import { fetchLandingBlogPost } from '@/lib/blog-post-build-cache';

function slugsMatch(left: string, right: string): boolean {
  return normalizeBlogRouteSlug(left) === normalizeBlogRouteSlug(right);
}

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug: rawSlug, locale } = await params;
    // Next static export can pass Unicode slugs percent-encoded; decode before API lookup.
    const slug = normalizeBlogRouteSlug(rawSlug);
    
    const { status, post, slugMap } = await fetchLandingBlogPost(
      buildFunctionsUrl,
      locale,
      slug,
      locales,
      `Failed to fetch metadata for "${locale}/blog/${slug}"`,
    );
    
    if (!post) {
      if (status === 404) {
        return {
          title: 'Blog Post Not Found',
          description: 'This AI photo guide is unavailable or has been moved.',
          robots: {
            index: false,
            follow: false,
          },
        };
      }

      throw new Error(`Failed to fetch /blog-post metadata for "${locale}/blog/${slug}" (status ${status}).`);
    }
    
    return buildBlogPostMetadata(post, {
      locale,
      canonicalSlug: slugMap[locale],
      defaultSlug: slugMap[defaultLocale],
      slugMap,
      indexable: slugsMatch(slug, slugMap[locale]),
    });
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
  const { slug: rawSlug, locale } = await params;
  // Keep this in sync with metadata lookup so Unicode localized URLs don't build as noindex 404s.
  const slug = normalizeBlogRouteSlug(rawSlug);
  const { status, post: initialPost } = await fetchLandingBlogPost(
    buildFunctionsUrl,
    locale,
    slug,
    locales,
    `Failed to fetch blog page "${locale}/blog/${slug}"`,
  );
  if (!initialPost) {
    if (status === 404) {
      notFound();
    }
    throw new Error(`Failed to fetch /blog-post for "${locale}/blog/${slug}" (status ${status}).`);
  }

  if (typeof initialPost.content !== 'string' || !initialPost.content) {
    notFound();
  }

  return <BlogPostPageClient slug={slug} locale={locale} initialPost={initialPost} />;
}
