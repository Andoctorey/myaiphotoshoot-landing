import { MetadataRoute } from 'next'
import { BlogListItem } from '@/types/blog'
import { locales } from '@/i18n/request'
import { env } from '@/lib/env'

/**
 * Sitemap generator
 * 
 * CLOUDFLARE PAGES NOTE:
 * This sitemap is generated dynamically and cached on Cloudflare Pages.
 * It includes static pages and blog posts across supported locales.
 */

// Cache for 1 hour on Cloudflare Pages
export const revalidate = 3600; // 1 hour revalidation

// API page size limit
const PAGE_SIZE = 100;

/**
 * Fetch all blog posts for all locales
 * Gets published blog posts from the database
 */
async function getAllBlogPosts(): Promise<(BlogListItem & { locale: string })[]> {
  try {
    const allPosts: (BlogListItem & { locale: string })[] = [];
    
    // Fetch blog posts for each locale
    for (const locale of locales) {
      try {
        let currentPage = 1;
        let hasMorePosts = true;
        
        while (hasMorePosts) {
          const response = await fetch(
            `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=${currentPage}&limit=${PAGE_SIZE}&locale=${locale}`,
            {
              next: { revalidate: 3600 }, // Cache for 1 hour
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
            // Add locale information to each post
            const localizedPosts = posts.map((post: BlogListItem) => ({
              ...post,
              locale,
            }));
            allPosts.push(...localizedPosts);
            
            if (posts.length < PAGE_SIZE) {
              hasMorePosts = false;
            } else {
              currentPage++;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching blog posts for locale ${locale}:`, error);
      }
    }
    
    console.log(`Sitemap: Fetched ${allPosts.length} total blog posts across ${locales.length} locales`);
    return allPosts;
    
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }
}

/**
 * Fetch all use-cases for all locales
 * Gets published use-cases from the database
 */
async function getAllUseCases(): Promise<Array<{ slug: string; featured_image_urls?: string[]; created_at?: string; locale: string }>> {
  try {
    const allItems: Array<{ slug: string; featured_image_urls?: string[]; created_at?: string; locale: string }> = [];

    for (const locale of locales) {
      try {
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(
            `${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=${currentPage}&limit=${PAGE_SIZE}&locale=${locale}`,
            { next: { revalidate: 3600 } }
          );

          if (!response.ok) {
            console.warn(`Failed to fetch use-cases for locale ${locale}:`, response.status);
            break;
          }

          const data = await response.json();
          const items = (data.items || []) as Array<{ slug?: string; featured_image_urls?: string[]; created_at?: string }>;

          if (items.length === 0) {
            hasMore = false;
          } else {
            items.forEach((it) => {
              if (it.slug) {
                allItems.push({
                  slug: it.slug,
                  featured_image_urls: it.featured_image_urls,
                  created_at: it.created_at,
                  locale,
                });
              }
            });

            if (items.length < PAGE_SIZE) {
              hasMore = false;
            } else {
              currentPage++;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching use-cases for locale ${locale}:`, error);
      }
    }

    console.log(`Sitemap: Fetched ${allItems.length} total use-cases across ${locales.length} locales`);
    return allItems;
  } catch (error) {
    console.error('Error fetching use-cases for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myaiphotoshoot.com';
  
  // Generate static pages for all supported locales
  const staticPages = [
    // Root page
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Locale-specific home pages
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    // Blog listing pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    // Use-cases listing pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/use-cases/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    // Support pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/support/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  try {
    // Fetch all blog posts
    const blogPosts = await getAllBlogPosts();
    // Fetch all use-cases
    const useCases = await getAllUseCases();

    // Create blog post entries for each locale
    const blogPostEntries = blogPosts.map((post: BlogListItem & { locale: string }) => ({
      url: `${baseUrl}/${post.locale}/blog/${post.slug}/`,
      lastModified: new Date(post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    }));
    
    // Create use-case entries for each locale
    const useCaseEntries = useCases.map((item: { slug: string; featured_image_urls?: string[]; created_at?: string; locale: string }) => ({
      url: `${baseUrl}/${item.locale}/use-cases/${item.slug}/`,
      lastModified: item.created_at ? new Date(item.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: Array.isArray(item.featured_image_urls) && item.featured_image_urls.length > 0 ? [item.featured_image_urls[0]] : [],
    }));

    return [...staticPages, ...blogPostEntries, ...useCaseEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return just the static pages if we can't fetch content
    return staticPages;
  }
} 