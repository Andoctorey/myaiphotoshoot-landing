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
import { BASE_URL, localePath, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogPost } from '@/types/blog';
import { fetchAllPublishedBlogSlugs, getBlogSlugMap } from '@/lib/blog-static-params';

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
      if (response.status === 404) {
        return {
          title: 'Blog Post Not Found',
          description: 'The requested blog post could not be found.',
          robots: {
            index: false,
            follow: false,
          },
        };
      }

      throw new Error(`Failed to fetch /blog-post metadata for "${slug}" (status ${response.status}).`);
    }

    const post = await response.json();

    if (!post) {
      return {
        title: 'Blog Post Not Found',
        description: 'The requested blog post could not be found.',
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
    slugMap[defaultLocale] = slug;
    const languages = Object.fromEntries(
      Object.entries(slugMap).map(([language, localizedSlug]) => [
        language,
        localePath(language, `/blog/${localizedSlug}/`),
      ]),
    );
    languages['x-default'] = localePath(defaultLocale, `/blog/${slug}/`);
    const url = `${BASE_URL}${localePath(defaultLocale, `/blog/${slug}/`)}`;
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
        locale: ogLocaleFromAppLocale(defaultLocale),
        alternateLocale: ogAlternateLocales(locales, defaultLocale),
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

  const res = await fetch(
    buildFunctionsUrl('/blog-post', { slug, locale: defaultLocale }),
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error(`Failed to fetch /blog-post for "${slug}" (status ${res.status}).`);
  }
  const initialPost: unknown | null = await res.json();

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
