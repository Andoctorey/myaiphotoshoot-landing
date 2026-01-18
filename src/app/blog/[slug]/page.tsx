/**
 * Default-locale Blog Post Page
 *
 * This keeps /blog/[slug] working when English lives at the root.
 */
import BlogPostPageClient from '../../[locale]/blog/[slug]/BlogPostPageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { env } from '@/lib/env';
import { locales, defaultLocale } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogPost } from '@/types/blog';

const buildFunctionsUrl = (path: string, params?: Record<string, string>) => {
  const base = new URL(env.SUPABASE_FUNCTIONS_URL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = base.pathname.replace(/\/$/, '');
  base.pathname = `${basePath}${normalizedPath}`;
  base.search = '';
  if (params) {
    base.search = new URLSearchParams(params).toString();
  }
  return base.toString();
};

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO (default locale at root)
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const response = await fetch(
      buildFunctionsUrl('/blog-post', { slug, locale: defaultLocale }),
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
    const url = canonicalUrl(defaultLocale, `/blog/${slug}/`);
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
      alternates: buildAlternates(defaultLocale, `/blog/${slug}/`, locales),
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
        locale: ogLocaleFromAppLocale(defaultLocale),
        alternateLocale: ogAlternateLocales(locales, defaultLocale),
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

// Generate static params for default locale blog posts
export async function generateStaticParams() {
  try {
    const allParams: { slug: string }[] = [];
    const response = await fetch(
      buildFunctionsUrl('/blog-posts', { sitemap: '1' }),
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch blog posts for locale ${defaultLocale}:`, response.status);
      return allParams;
    }

    const data = await response.json();
    const posts = data.posts || [];

    posts.forEach((post: { slug?: string | null }) => {
      if (post.slug) {
        allParams.push({ slug: post.slug });
      }
    });

    return allParams;
  } catch (error) {
    console.error('Error generating static params for blog posts:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  let initialPost: unknown | null = null;
  const res = await fetch(
    buildFunctionsUrl('/blog-post', { slug, locale: defaultLocale }),
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

  return (
    <BlogPostPageClient
      slug={slug}
      locale={defaultLocale}
      initialPost={(initialPost as BlogPost) || undefined}
    />
  );
}
