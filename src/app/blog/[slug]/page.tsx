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
import { BASE_URL, buildMetaDescription, localePath, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { fetchAllPublishedBlogSlugs } from '@/lib/blog-static-params';
import { fetchLandingBlogPost } from '@/lib/blog-post-build-cache';

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

    const title = post.title;
    const socialTitle = `${post.title} | My AI Photoshoot`;
    const description = buildMetaDescription(post.meta_description, post.title);
    const articleTags = articleTagsFromPhotoTopics(post.photo_topics);
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
      : 'https://myaiphotoshoot.com/og-image-v2.jpg?v=8';

    // Infer MIME type from URL extension for better OG accuracy
    const inferMimeFromUrl = (url: string | null | undefined): string | null => {
      if (!url || typeof url !== 'string') return null;
      const lower = url.toLowerCase().split(/[?#]/, 1)[0];
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
      authors: [{ name: 'My AI Photoshoot', url: 'https://myaiphotoshoot.com' }],
      creator: 'My AI Photoshoot',
      publisher: 'My AI Photoshoot',
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
        siteName: 'My AI Photoshoot',
        images: [
          {
            url: imageUrl,
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
        authors: ['My AI Photoshoot'],
      },
      twitter: {
        card: 'summary_large_image',
        title: socialTitle,
        description,
        images: [{ url: imageUrl, alt: post.title }],
      },
      other: {
        'article:author': 'My AI Photoshoot',
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
