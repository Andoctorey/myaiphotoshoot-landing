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

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO (default locale at root)
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${defaultLocale}`,
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
    let currentPage = 1;
    let hasMorePosts = true;

    while (hasMorePosts) {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=${currentPage}&limit=100&locale=${defaultLocale}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch blog posts for locale ${defaultLocale}:`, response.status);
        break;
      }

      const data = await response.json();
      const posts = data.posts || [];

      if (posts.length === 0) {
        hasMorePosts = false;
      } else {
        posts.forEach((post: { slug?: string }) => {
          if (post.slug) {
            allParams.push({ slug: post.slug });
          }
        });

        if (posts.length < 100) {
          hasMorePosts = false;
        } else {
          currentPage++;
        }
      }
    }

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
    `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${defaultLocale}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    notFound();
  }
  initialPost = await res.json();

  if (!initialPost || !(initialPost as BlogPost).content) {
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

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO (default locale at root)
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${defaultLocale}`,
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
    let currentPage = 1;
    let hasMorePosts = true;

    while (hasMorePosts) {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=${currentPage}&limit=100&locale=${defaultLocale}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch blog posts for locale ${defaultLocale}:`, response.status);
        break;
      }

      const data = await response.json();
      const posts = data.posts || [];

      if (posts.length === 0) {
        hasMorePosts = false;
      } else {
        posts.forEach((post: { slug?: string }) => {
          if (post.slug) {
            allParams.push({ slug: post.slug });
          }
        });

        if (posts.length < 100) {
          hasMorePosts = false;
        } else {
          currentPage++;
        }
      }
    }

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
    `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${defaultLocale}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    notFound();
  }
  initialPost = await res.json();

  if (!initialPost || !(initialPost as BlogPost).content) {
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
/**
 * English Blog Post Page - Cloudflare Pages Deployment
 */
import BlogPostPageClient from '@/app/[locale]/blog/[slug]/BlogPostPageClient';
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogPost } from '@/types/blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const locale = 'en';
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${locale}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return {
        title: 'Blog Post Not Found - My AI Photo Shoot',
        description: 'The requested blog post could not be found.',
      };
    }

    const post = await response.json();
    if (!post) {
      return {
        title: 'Blog Post Not Found - My AI Photo Shoot',
        description: 'The requested blog post could not be found.',
      };
    }

    const title = `${post.title} | My AI Photo Shoot`;
    const description = post.meta_description || post.title;
    const url = canonicalUrl(locale, `/blog/${slug}/`);
    const imageUrl = post.featured_image_url || 'https://myaiphotoshoot.com/og-image.png';

    const inferMimeFromUrl = (imgUrl: string | null | undefined): string | null => {
      if (!imgUrl) return null;
      const lower = imgUrl.toLowerCase();
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

export async function generateStaticParams() {
  try {
    const locale = 'en';
    const allParams: { slug: string }[] = [];
    let currentPage = 1;
    let hasMorePosts = true;

    while (hasMorePosts) {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=${currentPage}&limit=100&locale=${locale}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        break;
      }

      const data = await response.json();
      const posts = data.posts || [];

      if (posts.length === 0) {
        hasMorePosts = false;
      } else {
        posts.forEach((post: { slug?: string }) => {
          if (post.slug) {
            allParams.push({ slug: post.slug });
          }
        });

        if (posts.length < 100) {
          hasMorePosts = false;
        } else {
          currentPage++;
        }
      }
    }

    return allParams;
  } catch (error) {
    console.error('Error generating static params for blog posts:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;
    const locale = 'en';
    let initialPost: unknown | null = null;
    try {
      const res = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-post?slug=${slug}&locale=${locale}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        initialPost = await res.json();
      }
    } catch {}

    return <BlogPostPageClient slug={slug} locale={locale} initialPost={(initialPost as BlogPost) || undefined} />;
  } catch (error) {
    console.error('Error in BlogPostPage:', error);
    return <div>Error loading blog post</div>;
  }
}
