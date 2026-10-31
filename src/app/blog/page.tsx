import { buildBlogIndexMetadata, fetchBlogIndexData } from '@/lib/blog-index';
import BlogPageClient from '../[locale]/blog/BlogPageClient';
import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/request';
import { loadMessages } from '@/lib/i18n-messages';

// SEO metadata for the default-locale blog listing page
export async function generateMetadata(): Promise<Metadata> {
  try {
    return buildBlogIndexMetadata(defaultLocale, await loadMessages(defaultLocale));
  } catch {
    return {
      title: 'AI Photo Blog',
      description: 'Practical tips and tutorials for better AI portraits and prompts.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage() {
  const { initialPosts, initialPagination, archivePosts } = await fetchBlogIndexData(defaultLocale);

  return (
    <BlogPageClient
      locale={defaultLocale}
      initialPosts={initialPosts}
      initialPagination={initialPagination}
      archivePosts={archivePosts}
    />
  );
}
