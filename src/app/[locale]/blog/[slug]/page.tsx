/**
 * Blog Post Page - Cloudflare Pages Deployment
 * 
 * This page uses Next.js dynamic routing with Cloudflare Pages native support.
 * Features:
 * - Server-side rendering for perfect SEO
 * - Dynamic metadata generation
 * - Automatic sitemap inclusion
 * - Edge caching for fast performance
 */
import BlogPostPageClient from './BlogPostPageClient';
import type { Metadata } from 'next';
import { env } from '@/lib/env';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    
    // Fetch blog post data for metadata
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
    const url = `https://myaiphotoshoot.com/${locale}/blog/${slug}`;
    const imageUrl = post.featured_image_url || 'https://myaiphotoshoot.com/og-image.png';
    
    // Enhanced keywords for better SEO
    const baseKeywords = 'AI photography, AI photos, AI art, artificial intelligence, photo generation, professional headshots';
    const topicKeywords = post.photo_topics || '';
    const localeKeywords = locale === 'en' ? 'AI photography blog' : `AI photography ${locale}`;
    const enhancedKeywords = `${topicKeywords}, ${baseKeywords}, ${localeKeywords}`;
    
    return {
      title,
      description,
      keywords: enhancedKeywords,
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
        languages: {
          'en': '/en/blog/' + slug,
          'zh': '/zh/blog/' + slug,
          'es': '/es/blog/' + slug,
          'de': '/de/blog/' + slug,
          'fr': '/fr/blog/' + slug,
          'ja': '/ja/blog/' + slug,
          'ru': '/ru/blog/' + slug,
          'ar': '/ar/blog/' + slug,
          'hi': '/hi/blog/' + slug,
        },
      },
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
            type: 'image/jpeg',
          },
        ],
        locale,
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
        creator: '@myaiphotoshoot',
        site: '@myaiphotoshoot',
      },
      // Enhanced for better indexing
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

// No generateStaticParams needed - using dynamic routing with Cloudflare Pages

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug, locale } = await params;

    return <BlogPostPageClient slug={slug} locale={locale} />;
  } catch (error) {
    console.error('Error in BlogPostPage:', error);
    return <div>Error loading blog post</div>;
  }
} 