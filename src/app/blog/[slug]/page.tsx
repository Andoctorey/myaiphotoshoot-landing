/**
 * Default-locale Blog Post Page
 *
 * This keeps /blog/[slug] working when English lives at the root.
 */
import { buildBlogPostMetadata } from '@/lib/blog-post-metadata';
import { buildFunctionsUrl } from '@/lib/functions-url';
import BlogPostPageClient from '../../[locale]/blog/[slug]/BlogPostPageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/request';
import { fetchAllPublishedBlogSlugs } from '@/lib/blog-static-params';
import { fetchLandingBlogPost } from '@/lib/blog-post-build-cache';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO (default locale at root)
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const { status, post, slugMap } = await fetchLandingBlogPost(
      buildFunctionsUrl,
      defaultLocale,
      slug,
      locales,
      `Failed to fetch metadata for "blog/${slug}"`,
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

      throw new Error(`Failed to fetch /blog-post metadata for "${slug}" (status ${status}).`);
    }

    return buildBlogPostMetadata(post, {
      locale: defaultLocale,
      canonicalSlug: slug,
      defaultSlug: slug,
      slugMap,
      indexable: true,
    });
  } catch (error) {
    console.error('Error generating blog post metadata:', error);
    throw error;
  }
}

// Generate static params for default locale blog posts
export async function generateStaticParams() {
  const slugs = await fetchAllPublishedBlogSlugs(
    buildFunctionsUrl,
    `Failed to fetch blog posts for locale ${defaultLocale}`,
  );
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const { status, post: initialPost } = await fetchLandingBlogPost(
    buildFunctionsUrl,
    defaultLocale,
    slug,
    locales,
    `Failed to fetch blog page "blog/${slug}"`,
  );
  if (!initialPost) {
    if (status === 404) {
      notFound();
    }
    throw new Error(`Failed to fetch /blog-post for "${slug}" (status ${status}).`);
  }

  if (typeof initialPost.content !== 'string' || !initialPost.content) {
    notFound();
  }

  return (
    <BlogPostPageClient
      slug={slug}
      locale={defaultLocale}
      initialPost={initialPost}
    />
  );
}
