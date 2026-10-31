import { buildBlogIndexMetadata, fetchBlogIndexData } from '@/lib/blog-index';
import BlogPageClient from './BlogPageClient';
import type { Metadata } from 'next';
import { loadMessages } from '@/lib/i18n-messages';

type Props = {
  params: Promise<{ locale: string }>;
};

// SEO metadata for the blog listing page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale } = await params;

    return buildBlogIndexMetadata(locale, await loadMessages(locale));
  } catch {
    // Never throw in metadata; return safe defaults
    return {
      title: 'AI Photo Blog',
      description: 'Practical tips and tutorials for better AI portraits and prompts.',
      robots: { index: true, follow: true },
    };
  }
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  const { initialPosts, initialPagination, archivePosts } = await fetchBlogIndexData(locale, { localized: true });

  return (
    <BlogPageClient
      locale={locale}
      initialPosts={initialPosts}
      initialPagination={initialPagination}
      archivePosts={archivePosts}
    />
  );
}
