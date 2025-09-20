import BlogPageClient from './BlogPageClient';
import type { Metadata } from 'next';
import { locales } from '@/i18n/request';
import { buildAlternates } from '@/lib/seo';
import { env } from '@/lib/env';
import type { BlogPostsResponse, BlogListItem } from '@/types/blog';
import { loadMessages } from '@/lib/i18n-messages';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// SEO metadata for the blog listing page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale } = await params;

    const url = `https://myaiphotoshoot.com/${locale}/blog/`;
    const messages = await loadMessages(locale);
    const blogTitle = typeof (messages as any)?.blog?.title === 'string' ? (messages as any).blog.title as string : 'AI Photo Blog';
    const title = `${blogTitle} | My AI Photo Shoot`;
    const description = typeof (messages as any)?.blog?.description === 'string'
      ? (messages as any).blog.description as string
      : 'Discover the latest tips, tutorials, and insights about AI photography and digital art creation.';

    return {
      title,
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
        title,
        description,
        url,
        siteName: 'My AI Photo Shoot',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    // Never throw in metadata; return safe defaults
    return {
      title: 'AI Photo Blog | My AI Photo Shoot',
      description: 'Discover tips and tutorials about AI photography and digital art.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  let initialPosts: BlogListItem[] = [];
  let initialPagination: { total: number; page: number; limit: number; totalPages: number } | null = null;

  try {
    const res = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=10&locale=${locale}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = (await res.json()) as BlogPostsResponse;
      initialPosts = json.posts || [];
      initialPagination = {
        total: json.total,
        page: json.page,
        limit: json.limit,
        totalPages: json.totalPages,
      };
    }
  } catch {
    // Non-fatal: fall back to client fetch
  }

  return <BlogPageClient locale={locale} initialPosts={initialPosts} initialPagination={initialPagination || undefined} />;
} 