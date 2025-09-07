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
 * Build full URL for a localized path.
 * English lives at root; all other locales are under their locale prefix.
 */
function buildLocalizedUrl(baseUrl: string, locale: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const withTrailingSlash = normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`;
  const localizedPath = locale === 'en' ? withTrailingSlash : `/${locale}${withTrailingSlash}`;
  return `${baseUrl}${localizedPath}`;
}

/**
 * Build hreflang languages map for a given path and a set of available locales.
 * Includes x-default pointing to English if present; otherwise the first available.
 */
function buildHreflangLanguages(
  baseUrl: string,
  path: string,
  availableLocales: readonly string[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of availableLocales) {
    map[l] = buildLocalizedUrl(baseUrl, l, path);
  }
  // x-default should point to English variant when available, else first available
  if (availableLocales.includes('en')) {
    map['x-default'] = buildLocalizedUrl(baseUrl, 'en', path);
  } else if (availableLocales.length > 0) {
    map['x-default'] = map[availableLocales[0]];
  }
  return map;
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
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/', locales),
      },
    },
    // Locale-specific home pages
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/', locales),
      },
    })),
    // Blog listing pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/blog/', locales),
      },
    })),
    // Use-cases listing pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/use-cases/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/use-cases/', locales),
      },
    })),
    // Support pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/support/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/support/', locales),
      },
    })),
  ];

  try {
    // Fetch all blog posts
    const blogPosts = await getAllBlogPosts();
    // Fetch all use-cases
    const useCases = await getAllUseCases();

    // Group blog posts by slug to build hreflang alternates per article
    const postsBySlug = new Map<string, Array<BlogListItem & { locale: string }>>();
    for (const post of blogPosts) {
      const key = post.slug;
      if (!key) continue;
      const arr = postsBySlug.get(key) ?? [];
      arr.push(post);
      postsBySlug.set(key, arr);
    }

    const blogPostEntries: MetadataRoute.Sitemap = [];
    for (const [slug, group] of postsBySlug.entries()) {
      const availableLocales = group.map(g => g.locale);
      const languages = buildHreflangLanguages(baseUrl, `/blog/${slug}/`, availableLocales);
      for (const post of group) {
        blogPostEntries.push({
          url: `${baseUrl}/${post.locale}/blog/${post.slug}/`,
          lastModified: new Date(post.created_at),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
          images: post.featured_image_url ? [post.featured_image_url] : [],
        });
      }
    }
    
    // Group use-cases by slug to build hreflang alternates per item
    type UseCaseItem = { slug: string; featured_image_urls?: string[]; created_at?: string; locale: string };
    const useCasesBySlug = new Map<string, Array<UseCaseItem>>();
    for (const item of useCases) {
      const key = item.slug;
      if (!key) continue;
      const arr = useCasesBySlug.get(key) ?? [];
      arr.push(item);
      useCasesBySlug.set(key, arr);
    }

    const useCaseEntries: MetadataRoute.Sitemap = [];
    for (const [slug, group] of useCasesBySlug.entries()) {
      const availableLocales = group.map(g => g.locale);
      const languages = buildHreflangLanguages(baseUrl, `/use-cases/${slug}/`, availableLocales);
      for (const item of group) {
        useCaseEntries.push({
          url: `${baseUrl}/${item.locale}/use-cases/${item.slug}/`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
          images: Array.isArray(item.featured_image_urls) && item.featured_image_urls.length > 0 ? [item.featured_image_urls[0]] : [],
        });
      }
    }

    return [...staticPages, ...blogPostEntries, ...useCaseEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return just the static pages if we can't fetch content
    return staticPages;
  }
} 