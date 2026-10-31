import type { Metadata } from 'next';
import type { BlogPost } from '@/types/blog';
import { defaultLocale, locales } from '@/i18n/request';
import { BASE_URL, buildMetaDescription, localePath, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

type BlogPostMetadataOptions = {
  locale: string;
  canonicalSlug: string;
  defaultSlug: string;
  slugMap: Record<string, string>;
  indexable: boolean;
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

function inferMimeFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const lower = url.toLowerCase().split(/[?#]/, 1)[0];
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return null;
}

export function buildBlogPostMetadata(
  post: BlogPost,
  { locale, canonicalSlug, defaultSlug, slugMap, indexable }: BlogPostMetadataOptions,
) {
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
  languages['x-default'] = localePath(defaultLocale, `/blog/${defaultSlug}/`);
  const url = `${BASE_URL}${localePath(locale, `/blog/${canonicalSlug}/`)}`;
  const imageUrl = typeof post.featured_image_url === 'string'
    ? post.featured_image_url
    : 'https://myaiphotoshoot.com/og-image-v2.jpg?v=8';
  const ogImageType = inferMimeFromUrl(imageUrl);

  return {
    title,
    description,
    authors: [{ name: 'My AI Photoshoot', url: 'https://myaiphotoshoot.com' }],
    creator: 'My AI Photoshoot',
    publisher: 'My AI Photoshoot',
    category: 'AI Photography',
    robots: {
      index: indexable,
      follow: true,
      googleBot: {
        index: indexable,
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
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
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
  } satisfies Metadata;
}
