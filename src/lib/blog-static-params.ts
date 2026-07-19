import { defaultLocale } from '@/i18n/request';
import type { BlogListItem } from '@/types/blog';

type BuildFunctionsUrl = (path: string, params?: Record<string, string>) => string;

const REVALIDATE_SECONDS = 3600;
const FALLBACK_PAGE_LIMIT = 5;
const MAX_PAGES = 200;

type BlogTranslation = {
  slug?: string | null;
  title?: string | null;
  meta_description?: string | null;
};

export type BlogListEntry = {
  slug: string;
  created_at: string;
  featured_image_url?: string | null;
  title?: string | null;
  meta_description?: string | null;
  translations?: Record<string, BlogTranslation> | null;
};

type BlogPostsPage = {
  posts?: unknown;
  totalPages?: unknown;
};

const normalizeBlogTranslations = (
  value: unknown,
  context: string,
): Record<string, BlogTranslation> | null => {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} returned invalid blog translations.`);
  }

  const translations: Record<string, BlogTranslation> = {};
  for (const [locale, rawTranslation] of Object.entries(value)) {
    if (!rawTranslation || typeof rawTranslation !== 'object' || Array.isArray(rawTranslation)) {
      throw new Error(`${context} returned an invalid "${locale}" blog translation.`);
    }

    const translation = rawTranslation as Record<string, unknown>;
    for (const field of ['slug', 'title', 'meta_description'] as const) {
      if (translation[field] != null && typeof translation[field] !== 'string') {
        throw new Error(`${context} returned a non-string ${field} for the "${locale}" blog translation.`);
      }
    }

    translations[locale] = {
      slug: typeof translation.slug === 'string' ? translation.slug.trim() || null : null,
      title: typeof translation.title === 'string' ? translation.title : null,
      meta_description: typeof translation.meta_description === 'string' ? translation.meta_description : null,
    };
  }

  return translations;
};

const normalizeBlogPosts = (payload: unknown, context: string): BlogListEntry[] => {
  const posts = (payload as BlogPostsPage)?.posts;
  if (!Array.isArray(posts)) {
    throw new Error(`${context} returned an invalid payload (missing posts array).`);
  }

  const normalized: BlogListEntry[] = [];
  for (const raw of posts) {
    const post = raw as Record<string, unknown>;
    const slug = typeof post.slug === 'string' ? post.slug.trim() : '';
    const createdAt = typeof post.created_at === 'string' ? post.created_at.trim() : '';
    if (!slug || !createdAt) {
      throw new Error(`${context} returned a blog post without a valid slug or created_at value.`);
    }
    normalized.push({
      slug,
      created_at: createdAt,
      featured_image_url: typeof post.featured_image_url === 'string' ? post.featured_image_url : null,
      title: typeof post.title === 'string' ? post.title : null,
      meta_description: typeof post.meta_description === 'string' ? post.meta_description : null,
      translations: normalizeBlogTranslations(post.translations, context),
    });
  }

  return normalized;
};

const getTotalPages = (payload: unknown, context: string): number => {
  const value = (payload as BlogPostsPage)?.totalPages;
  const totalPages = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(totalPages) || totalPages < 1) {
    throw new Error(`${context} returned an invalid totalPages value: ${String(value)}`);
  }
  return Math.min(Math.floor(totalPages), MAX_PAGES);
};

async function fetchPaginatedPublishedBlogPosts(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<BlogListEntry[]> {
  const allPosts: BlogListEntry[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = buildFunctionsUrl('/blog-posts', {
      page: String(page),
      limit: String(FALLBACK_PAGE_LIMIT),
      locale: defaultLocale,
    });

    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) {
      throw new Error(`${context} failed to fetch ${url} (status ${response.status}).`);
    }

    const data = await response.json();
    allPosts.push(...normalizeBlogPosts(data, context));
    if (page === 1) {
      totalPages = getTotalPages(data, context);
    }
    page += 1;
  }

  return allPosts;
}

export async function fetchAllPublishedBlogPosts(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<BlogListEntry[]> {
  try {
    return await fetchPublishedBlogInventory(buildFunctionsUrl, context);
  } catch (error) {
    console.warn(`${context} could not fetch the slim localized inventory; falling back to the paginated blog list.`, error);
    return fetchPaginatedPublishedBlogPosts(buildFunctionsUrl, context);
  }
}

export async function fetchPublishedBlogInventory(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<BlogListEntry[]> {
  const url = buildFunctionsUrl('/blog-posts', {
    sitemap: '1',
  });
  const retryUrl = buildFunctionsUrl('/blog-posts', {
    sitemap: '1',
    inventory_retry: '1',
  });
  const inventoryUrls = [url, retryUrl];
  let lastError: unknown;

  for (const inventoryUrl of inventoryUrls) {
    try {
      const response = await fetch(inventoryUrl, { next: { revalidate: REVALIDATE_SECONDS } });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }
      const data = await response.json();
      return normalizeBlogPosts(data, context);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`${context} failed to fetch the complete localized blog inventory from ${url}.`, {
    cause: lastError,
  });
}

export async function fetchAllPublishedBlogSlugs(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<string[]> {
  const posts = await fetchPublishedBlogInventory(buildFunctionsUrl, context);
  const slugs = Array.from(new Set(posts.map((post) => post.slug).filter(Boolean)));

  if (slugs.length === 0) {
    throw new Error(`${context} returned zero published blog slugs.`);
  }

  return slugs;
}

/*
 * Blog SEO invariant:
 * - English posts live at /blog/:englishSlug/.
 * - Non-English posts must live at /:locale/blog/:localizedSlug/.
 * - /:locale/blog/:englishSlug/ is only an alias and should redirect, never become an indexed page.
 */
export function getBlogSlugForLocale(
  post: { slug?: string | null; translations?: Record<string, BlogTranslation> | null },
  locale: string,
): string | null {
  const defaultSlug = typeof post.slug === 'string' ? post.slug.trim() : '';
  if (locale === defaultLocale) {
    return defaultSlug || null;
  }

  const localizedSlug = post.translations?.[locale]?.slug?.trim();
  return localizedSlug || null;
}

export function getBlogSlugMap(
  post: { slug?: string | null; translations?: Record<string, BlogTranslation> | null },
  supportedLocales: readonly string[],
): Record<string, string> {
  const slugMap: Record<string, string> = {};
  for (const locale of supportedLocales) {
    const slug = getBlogSlugForLocale(post, locale);
    if (slug) {
      slugMap[locale] = slug;
    }
  }
  return slugMap;
}

export function normalizeBlogRouteSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).normalize('NFC');
  } catch {
    return slug.normalize('NFC');
  }
}

export function getBlogSlugMapForRoute(
  posts: BlogListEntry[],
  routeLocale: string,
  routeSlug: string,
  supportedLocales: readonly string[],
): Record<string, string> {
  const normalizedRouteSlug = normalizeBlogRouteSlug(routeSlug);
  const matches = posts.filter((post) => {
    const localizedSlug = getBlogSlugForLocale(post, routeLocale);
    return localizedSlug !== null && normalizeBlogRouteSlug(localizedSlug) === normalizedRouteSlug;
  });

  if (matches.length !== 1) {
    throw new Error(
      `Expected one blog inventory match for locale "${routeLocale}" and slug "${routeSlug}", found ${matches.length}.`,
    );
  }

  const slugMap = getBlogSlugMap(matches[0], supportedLocales);
  if (!slugMap[defaultLocale] || !slugMap[routeLocale]) {
    throw new Error(
      `Blog inventory match for locale "${routeLocale}" and slug "${routeSlug}" had an incomplete slug map.`,
    );
  }

  return slugMap;
}

export function localizeBlogListItemSlugs<T extends { slug?: string | null }>(
  posts: T[],
  allPosts: BlogListEntry[],
  locale: string,
): T[] {
  const canonicalSlugs = new Set<string>();
  const localizedSlugByDefault = new Map<string, string>();

  for (const post of allPosts) {
    const localizedSlug = getBlogSlugForLocale(post, locale);
    if (!localizedSlug) continue;

    canonicalSlugs.add(localizedSlug);
    localizedSlugByDefault.set(post.slug, localizedSlug);
  }

  return posts.map((post) => {
    const currentSlug = post.slug?.trim();
    if (!currentSlug || canonicalSlugs.has(currentSlug)) {
      return post;
    }

    const localizedSlug = localizedSlugByDefault.get(currentSlug);
    return localizedSlug ? { ...post, slug: localizedSlug } : post;
  });
}

export function projectBlogListItems(posts?: readonly BlogListItem[] | null): BlogListItem[] {
  return (posts ?? []).map(({
    id,
    title,
    slug,
    meta_description,
    featured_image_url,
    created_at,
  }) => ({
    id,
    title,
    slug,
    meta_description,
    featured_image_url,
    created_at,
  }));
}

export async function fetchAllPublishedBlogLocalizedParams(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
  supportedLocales: readonly string[],
): Promise<Array<{ locale: string; slug: string }>> {
  const posts = await fetchPublishedBlogInventory(buildFunctionsUrl, context);
  const params: Array<{ locale: string; slug: string }> = [];
  const seen = new Set<string>();

  for (const post of posts) {
    for (const locale of supportedLocales) {
      const localizedSlug = getBlogSlugForLocale(post, locale);
      if (!localizedSlug) {
        continue;
      }

      const key = `${locale}:${localizedSlug}`;
      if (!seen.has(key)) {
        params.push({ locale, slug: localizedSlug });
        seen.add(key);
      }
    }
  }

  if (params.length === 0) {
    throw new Error(`${context} returned zero published blog localized params.`);
  }

  return params;
}
