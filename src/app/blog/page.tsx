import BlogPageClient from '../[locale]/blog/BlogPageClient';
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { locales, defaultLocale } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { BlogListItem, BlogPostsResponse } from '@/types/blog';
import { loadMessages } from '@/lib/i18n-messages';
import { fetchAllPublishedBlogPosts, getBlogSlugForLocale, type BlogListEntry } from '@/lib/blog-static-params';

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

function getArchivePostTitle(post: BlogListEntry): string {
  return post.title?.trim() || post.slug;
}

// SEO metadata for the default-locale blog listing page
export async function generateMetadata(): Promise<Metadata> {
  try {
    const url = canonicalUrl(defaultLocale, '/blog/');
    const messages = await loadMessages(defaultLocale);
    type BlogI18n = { blog?: { title?: string; description?: string } };
    const m = messages as BlogI18n;
    const blogTitle = typeof m.blog?.title === 'string'
      ? m.blog.title as string
      : 'AI Photo Blog';
    const title = blogTitle;
    const socialTitle = `${blogTitle} | My AI Photo Shoot`;
    const description = typeof m.blog?.description === 'string'
      ? m.blog.description as string
      : 'Practical tips, tutorials, and ideas for better AI portraits, prompts, and digital image workflows.';

    return {
      title,
      description,
      alternates: buildAlternates(defaultLocale, '/blog/', locales),
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
        title: socialTitle,
        description,
        url,
        siteName: 'My AI Photo Shoot',
        type: 'website',
        locale: ogLocaleFromAppLocale(defaultLocale),
        alternateLocale: ogAlternateLocales(locales, defaultLocale),
      },
      twitter: {
        card: 'summary_large_image',
        title: socialTitle,
        description,
      },
    };
  } catch {
    return {
      title: 'AI Photo Blog',
      description: 'Practical tips and tutorials for better AI portraits and prompts.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage() {
  let initialPosts: BlogListItem[] = [];
  let initialPagination: { total: number; page: number; limit: number; totalPages: number } | null = null;
  let archivePosts: Array<{ slug: string; title: string }> = [];

  try {
    const [postsResult, archiveResult] = await Promise.allSettled([
      fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=12&locale=${defaultLocale}`,
        { next: { revalidate: 3600 } }
      ),
      fetchAllPublishedBlogPosts(
        buildFunctionsUrl,
        `Failed to fetch blog archive posts for locale ${defaultLocale}`,
      ),
    ]);
    const res = postsResult.status === 'fulfilled' ? postsResult.value : null;
    if (res?.ok) {
      const json = (await res.json()) as BlogPostsResponse;
      initialPosts = json.posts || [];
      initialPagination = {
        total: json.total,
        page: json.page,
        limit: json.limit,
        totalPages: json.totalPages,
      };
    }
    const allPosts = archiveResult.status === 'fulfilled' ? archiveResult.value : [];
    archivePosts = allPosts
      .map((post) => {
        const slug = getBlogSlugForLocale(post, defaultLocale);
        return slug ? { slug, title: getArchivePostTitle(post) } : null;
      })
      .filter((post): post is { slug: string; title: string } => post !== null);
  } catch {
    // Non-fatal: fall back to client fetch
  }

  return (
    <BlogPageClient
      locale={defaultLocale}
      initialPosts={initialPosts}
      initialPagination={initialPagination || undefined}
      archivePosts={archivePosts}
    />
  );
}
