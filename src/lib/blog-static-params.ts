import { defaultLocale } from '@/i18n/request';

type BuildFunctionsUrl = (path: string, params?: Record<string, string>) => string;

const REVALIDATE_SECONDS = 3600;
const PAGE_LIMIT = 20;
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
      continue;
    }
    normalized.push({
      slug,
      created_at: createdAt,
      featured_image_url: typeof post.featured_image_url === 'string' ? post.featured_image_url : null,
      title: typeof post.title === 'string' ? post.title : null,
      meta_description: typeof post.meta_description === 'string' ? post.meta_description : null,
      translations: (post.translations && typeof post.translations === 'object')
        ? (post.translations as Record<string, BlogTranslation>)
        : null,
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

export async function fetchAllPublishedBlogPosts(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<BlogListEntry[]> {
  const allPosts: BlogListEntry[] = [];

  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const url = buildFunctionsUrl('/blog-posts', {
      page: String(page),
      limit: String(PAGE_LIMIT),
      locale: defaultLocale,
    });

    const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) {
      throw new Error(`${context} failed to fetch ${url} (status ${response.status}).`);
    }

    const data = await response.json();
    const posts = normalizeBlogPosts(data, context);
    allPosts.push(...posts);

    if (page === 1) {
      totalPages = getTotalPages(data, context);
    }
    page += 1;
  }

  return allPosts;
}

export async function fetchAllPublishedBlogSlugs(
  buildFunctionsUrl: BuildFunctionsUrl,
  context: string,
): Promise<string[]> {
  const posts = await fetchAllPublishedBlogPosts(buildFunctionsUrl, context);
  const slugs = Array.from(new Set(posts.map((post) => post.slug).filter(Boolean)));

  if (slugs.length === 0) {
    throw new Error(`${context} returned zero published blog slugs.`);
  }

  return slugs;
}
