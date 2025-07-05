import BlogPostPageClient from './BlogPostPageClient';
import { locales } from '@/i18n/request';
import { env } from '@/lib/env';

interface BlogPostPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

// Generate static params for all blog posts across all locales
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  
  try {
    // Fetch blog posts for each locale to generate static params
    for (const locale of locales) {
      try {
        let currentPage = 1;
        let hasMorePosts = true;
        const PAGE_SIZE = 100; // Large page size to get all posts
        
        while (hasMorePosts) {
          const response = await fetch(
            `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=${currentPage}&limit=${PAGE_SIZE}&locale=${locale}`,
            {
              next: { revalidate: 0 }, // No caching during build
            }
          );
          
          if (!response.ok) {
            console.warn(`Failed to fetch blog posts for locale ${locale}:`, response.status);
            break;
          }
          
          const data = await response.json();
          const posts = data.posts || [];
          
          if (posts.length === 0) {
            hasMorePosts = false;
          } else {
            // Add params for each blog post
            posts.forEach((post: { slug: string }) => {
              params.push({ locale, slug: post.slug });
            });
            
            if (posts.length < PAGE_SIZE) {
              hasMorePosts = false;
            } else {
              currentPage++;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching blog posts for locale ${locale}:`, error);
        // Add a placeholder for this locale if fetch fails
        params.push({ locale, slug: 'placeholder' });
      }
    }
    
    // If no posts were found, add placeholders to prevent build errors
    if (params.length === 0) {
      for (const locale of locales) {
        params.push({ locale, slug: 'placeholder' });
      }
    }
    
    console.log(`generateStaticParams: Generated ${params.length} blog post params`);
    return params;
    
  } catch (error) {
    console.error('Error in generateStaticParams for blog posts:', error);
    
    // Fallback: generate placeholder params
    for (const locale of locales) {
      params.push({ locale, slug: 'placeholder' });
    }
    
    return params;
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = params;

  console.log('BlogPostPage render:', { slug, locale });

  return <BlogPostPageClient slug={slug} locale={locale} />;
} 