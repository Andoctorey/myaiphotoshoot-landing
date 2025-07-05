import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { BlogListItem } from '@/types/blog'
import { fetchGalleryPhotos } from '@/lib/fetcher'
import { locales } from '@/i18n/request'
import { env } from '@/lib/env'

/**
 * Sitemap generator
 * 
 * STATIC EXPORT NOTE:
 * This sitemap is generated at build time for Cloudflare Pages static hosting.
 * It fetches all photos from the database using pagination and includes all supported locales.
 */

// Add static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

// API page size limit
const PAGE_SIZE = 100;

/**
 * Fetch all photos with pagination
 * Uses the gallery API with pagination to get all photos
 */
async function getAllPhotos(): Promise<GalleryItem[]> {
  try {
    let allPhotos: GalleryItem[] = [];
    let currentPage = 1;
    let hasMorePhotos = true;
    
    // Continue fetching pages until we get an empty response
    while (hasMorePhotos) {
      const photos = await fetchGalleryPhotos<GalleryItem[]>(currentPage, PAGE_SIZE);
      
      if (photos.length === 0) {
        // No more photos to fetch
        hasMorePhotos = false;
      } else {
        // Add photos to our collection
        allPhotos = [...allPhotos, ...photos];
        
        // Check if we got fewer photos than the page size, meaning we've reached the end
        if (photos.length < PAGE_SIZE) {
          hasMorePhotos = false;
        } else {
          // Move to the next page
          currentPage++;
        }
      }
    }
    
    console.log(`Sitemap: Fetched ${allPhotos.length} total photos across ${currentPage} pages`);
    return allPhotos;
    
  } catch (error) {
    console.error('Error fetching photos for sitemap:', error);
    return [];
  }
}

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myaiphotoshoot.com';
  
  // Generate static pages for all supported locales
  const staticPages = [
    // Root page
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Locale-specific home pages
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    // Blog listing pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    // Support pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  try {
    // Fetch all photos and blog posts concurrently
    const [photos, blogPosts] = await Promise.all([
      getAllPhotos(),
      getAllBlogPosts(),
    ]);
    
    // Create photo entries without locale prefix
    const photoEntries = photos.map((photo) => ({
      url: `${baseUrl}/photo/${photo.id}`,
      lastModified: new Date(photo.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: [photo.public_url],
    }));
    
    // Create blog post entries for each locale
    const blogPostEntries = blogPosts.map((post: BlogListItem & { locale: string }) => ({
      url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
      lastModified: new Date(post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    }));
    
    return [...staticPages, ...photoEntries, ...blogPostEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return just the static pages if we can't fetch content
    return staticPages;
  }
} 