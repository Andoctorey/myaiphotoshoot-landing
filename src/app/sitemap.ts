import { MetadataRoute } from 'next'
import { locales } from '@/i18n/request'
import { env } from '@/lib/env'
import { fetchAllPublishedBlogPosts, getBlogSlugForLocale, getBlogSlugMap } from '@/lib/blog-static-params'
import { aiPresetsPagePath, fetchAiPresets, fetchAiPresetsPage } from '@/lib/ai-presets'

/**
 * Sitemap generator
 * 
 * CLOUDFLARE PAGES NOTE:
 * This sitemap is generated during static export for Cloudflare Pages.
 * It includes static pages and blog posts across supported locales.
 */
export const dynamic = 'force-static';

/**
 * Sitemap API response types
 */
interface SitemapBlogPost {
  slug: string | null
  created_at: string
  featured_image_url: string | null
  translations?: Record<string, { slug?: string | null }> | null
}

interface SitemapUseCase {
  slug: string | null
  created_at?: string
  featured_image_urls?: string[] | null
}

interface SitemapAiPreset {
  slug: string
  created_at?: string | null
  updated_at?: string | null
  featured_graphics?: string | null
}

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

function buildBlogPostHreflangLanguages(
  baseUrl: string,
  slugMap: Record<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugMap[locale];
    if (slug) {
      map[locale] = buildLocalizedUrl(baseUrl, locale, `/blog/${slug}/`);
    }
  }
  if (slugMap.en) {
    map['x-default'] = buildLocalizedUrl(baseUrl, 'en', `/blog/${slugMap.en}/`);
  }
  return map;
}

/**
 * Fetch all blog posts once for sitemap generation
 */
async function getAllBlogPosts(): Promise<SitemapBlogPost[]> {
  try {
    const posts = await fetchAllPublishedBlogPosts(
      buildFunctionsUrl,
      'Failed to fetch blog posts for sitemap',
    );
    console.log(`Sitemap: Fetched ${posts.length} total blog posts`);
    return posts.map((post) => ({
      slug: post.slug,
      created_at: post.created_at,
      featured_image_url: post.featured_image_url ?? null,
      translations: post.translations ?? null,
    }));
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

async function getAllAiPresets(): Promise<SitemapAiPreset[]> {
  try {
    const presets = await fetchAiPresets('en');
    console.log(`Sitemap: Fetched ${presets.length} total AI presets`);
    return presets;
  } catch (error) {
    console.error('Error fetching AI presets for sitemap:', error);
    return [];
  }
}

async function getAiPresetTotalPages(): Promise<number> {
  try {
    const page = await fetchAiPresetsPage('en', 1);
    return page.totalPages;
  } catch (error) {
    console.error('Error fetching AI preset page count for sitemap:', error);
    return 1;
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
    ...locales.filter(locale => locale !== 'en').map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/', locales),
      },
    })),
    // Blog listing pages for all locales
    {
      url: buildLocalizedUrl(baseUrl, 'en', '/blog/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/blog/', locales),
      },
    },
    ...locales.filter(locale => locale !== 'en').map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/blog/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/blog/', locales),
      },
    })),
    // Use-cases listing pages for all locales
    ...locales.map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/use-cases/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/use-cases/', locales),
      },
    })),
    // AI preset listing pages for all locales
    ...locales.map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/presets/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/presets/', locales),
      },
    })),
    // Supported AI model pages for all locales
    ...locales.map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/models/'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/models/', locales),
      },
    })),
    // Support pages for all locales
    ...locales.map(locale => ({
      url: buildLocalizedUrl(baseUrl, locale, '/support/'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: {
        languages: buildHreflangLanguages(baseUrl, '/support/', locales),
      },
    })),
    // Legal and license pages are English-only documents.
    {
      url: buildLocalizedUrl(baseUrl, 'en', '/legal/'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: buildLocalizedUrl(baseUrl, 'en', '/license/'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ];

  try {
    // Fetch all blog posts
    const blogPosts = await getAllBlogPosts();
    // Fetch all use-cases
    const useCases = await getAllUseCases();
    // Fetch all AI presets
    const aiPresets = await getAllAiPresets();
    const aiPresetTotalPages = await getAiPresetTotalPages();

    const blogPostEntries: MetadataRoute.Sitemap = [];
    for (const post of blogPosts) {
      if (!post.slug) continue;
      const slugMap = getBlogSlugMap(post, locales);
      const languages = buildBlogPostHreflangLanguages(baseUrl, slugMap);
      for (const locale of locales) {
        const localizedSlug = getBlogSlugForLocale(post, locale);
        if (!localizedSlug) continue;
        blogPostEntries.push({
          url: buildLocalizedUrl(baseUrl, locale, `/blog/${localizedSlug}/`),
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
          url: buildLocalizedUrl(baseUrl, locale, `/use-cases/${item.slug}/`),
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
          images: Array.isArray(item.featured_image_urls) && item.featured_image_urls.length > 0 ? [item.featured_image_urls[0]] : [],
        });
      }
    }

    const aiPresetEntries: MetadataRoute.Sitemap = [];
    const aiPresetPaginatedEntries: MetadataRoute.Sitemap = [];
    for (let page = 2; page <= aiPresetTotalPages; page += 1) {
      const path = aiPresetsPagePath(page);
      const languages = buildHreflangLanguages(baseUrl, path, locales);
      for (const locale of locales) {
        aiPresetPaginatedEntries.push({
          url: buildLocalizedUrl(baseUrl, locale, path),
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.65,
          alternates: { languages },
        });
      }
    }

    for (const item of aiPresets) {
      if (!item.slug) continue;
      const languages = buildHreflangLanguages(baseUrl, `/presets/${item.slug}/`, locales);
      const lastModified = item.updated_at || item.created_at;
      for (const locale of locales) {
        aiPresetEntries.push({
          url: buildLocalizedUrl(baseUrl, locale, `/presets/${item.slug}/`),
          lastModified: lastModified ? new Date(lastModified) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages },
          images: item.featured_graphics ? [item.featured_graphics] : [],
        });
      }
    }

    return [...staticPages, ...aiPresetPaginatedEntries, ...blogPostEntries, ...useCaseEntries, ...aiPresetEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return just the static pages if we can't fetch content
    return staticPages;
  }
} 
