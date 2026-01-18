import { MetadataRoute } from 'next'
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

/**
 * Sitemap API response types
 */
interface SitemapBlogPost {
  slug: string | null
  created_at: string
  featured_image_url: string | null
}

interface SitemapUseCase {
  slug: string | null
  created_at?: string
  featured_image_urls?: string[] | null
}

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
 * Fetch all blog posts once for sitemap generation
 */
async function getAllBlogPosts(): Promise<SitemapBlogPost[]> {
  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?sitemap=1`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch blog posts for sitemap:`, response.status);
      return [];
    }

    const data = await response.json();
    const posts = (data.posts || []) as SitemapBlogPost[];
    console.log(`Sitemap: Fetched ${posts.length} total blog posts`);
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }
}

/**
 * Fetch all use-cases once for sitemap generation
 */
async function getAllUseCases(): Promise<SitemapUseCase[]> {
  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/use-cases?sitemap=1`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch use-cases for sitemap:`, response.status);
      return [];
    }

    const data = await response.json();
    const items = (data.items || []) as SitemapUseCase[];
    console.log(`Sitemap: Fetched ${items.length} total use-cases`);
    return items;
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

    const blogPostEntries: MetadataRoute.Sitemap = [];
    for (const post of blogPosts) {
      if (!post.slug) continue;
      const languages = buildHreflangLanguages(baseUrl, `/blog/${post.slug}/`, locales);
      for (const locale of locales) {
        blogPostEntries.push({
          url: `${baseUrl}/${locale}/blog/${post.slug}/`,
          lastModified: new Date(post.created_at),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
          images: post.featured_image_url ? [post.featured_image_url] : [],
        });
      }
    }
    
    const useCaseEntries: MetadataRoute.Sitemap = [];
    for (const item of useCases) {
      if (!item.slug) continue;
      const languages = buildHreflangLanguages(baseUrl, `/use-cases/${item.slug}/`, locales);
      for (const locale of locales) {
        useCaseEntries.push({
          url: `${baseUrl}/${locale}/use-cases/${item.slug}/`,
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