import { env } from '@/lib/env';
import {
  fetchAllPublishedBlogPosts,
  localizeBlogListItemSlugs,
  type BlogListEntry,
} from '@/lib/blog-static-params';
import type { GalleryItem, GalleryRandomSession } from '@/types/gallery';
import type { BlogListItem } from '@/types/blog';

export type HomeData = {
  initialGallery: GalleryItem[];
  initialGallerySession: GalleryRandomSession;
  initialBlog: BlogListItem[];
  initialUseCases: Array<{ slug: string; title: string; featured_image_urls?: string[] }>;
};

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

async function loadHomeSection<T>(
  section: string,
  locale: string,
  load: () => T | Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(`Failed to load homepage ${section} for locale "${locale}".`, error);
    return fallback;
  }
}

export async function fetchHomeData(locale: string): Promise<HomeData> {
  const initialGallerySession = {
    seed: crypto.randomUUID(),
    asOf: new Date().toISOString(),
  };
  const galleryParams = new URLSearchParams({
    page: '1',
    limit: '20',
    sort: 'random',
    seed: initialGallerySession.seed,
    asOf: initialGallerySession.asOf,
  });

  const [initialGallery, blogCards, initialUseCases, blogArchive] = await Promise.all([
    loadHomeSection<GalleryItem[]>('gallery', locale, async () => {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?${galleryParams.toString()}`,
        { next: { revalidate: 3600 } },
      );
      if (!response.ok) {
        throw new Error(`Gallery request failed with status ${response.status}.`);
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Gallery response was not an array.');
      }

      return data.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Gallery response item ${index} was not an object.`);
        }
        const record = item as Record<string, unknown>;
        const id = typeof record.id === 'string' ? record.id.trim() : '';
        const createdAt = typeof record.created_at === 'string' ? record.created_at.trim() : '';
        const publicUrl = typeof record.public_url === 'string' ? record.public_url.trim() : '';
        const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : '';
        if (!id || !createdAt || !publicUrl || !prompt) {
          throw new Error(`Gallery response item ${index} had invalid required fields.`);
        }
        return {
          id,
          created_at: createdAt,
          public_url: publicUrl,
          prompt,
          preset_id: typeof record.preset_id === 'string' ? record.preset_id : null,
        };
      });
    }, []),
    loadHomeSection<BlogListItem[]>('blog cards', locale, async () => {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=6&locale=${locale}`,
        { next: { revalidate: 3600 } },
      );
      if (!response.ok) {
        throw new Error(`Blog cards request failed with status ${response.status}.`);
      }
      const data: unknown = await response.json();
      const posts = (data as { posts?: unknown })?.posts;
      if (!Array.isArray(posts)) {
        throw new Error('Blog cards response did not contain a posts array.');
      }

      const validatedPosts = posts.map((post, index) => {
        if (!post || typeof post !== 'object') {
          throw new Error(`Blog cards response item ${index} was not an object.`);
        }
        const record = post as Record<string, unknown>;
        const id = typeof record.id === 'string' ? record.id.trim() : '';
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        const createdAt = typeof record.created_at === 'string' ? record.created_at.trim() : '';
        const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
        const description = record.meta_description;
        const imageUrl = record.featured_image_url;
        if (!id || !title || !createdAt || !slug) {
          throw new Error(`Blog cards response item ${index} had invalid required fields.`);
        }
        if (description != null && typeof description !== 'string') {
          throw new Error(`Blog cards response item ${index} had an invalid meta description.`);
        }
        if (imageUrl != null && typeof imageUrl !== 'string') {
          throw new Error(`Blog cards response item ${index} had an invalid featured image URL.`);
        }
        return {
          id,
          title,
          slug,
          meta_description: description ?? null,
          featured_image_url: imageUrl ?? null,
          created_at: createdAt,
        };
      });

      return validatedPosts;
    }, []),
    loadHomeSection<HomeData['initialUseCases']>('use cases', locale, async () => {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=12&locale=${locale}`,
        { next: { revalidate: 3600 } },
      );
      if (!response.ok) {
        throw new Error(`Use-case request failed with status ${response.status}.`);
      }
      const data: unknown = await response.json();
      const items = (data as { items?: unknown })?.items;
      if (!Array.isArray(items)) {
        throw new Error('Use-case response did not contain an items array.');
      }

      return items.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Use-case response item ${index} was not an object.`);
        }
        const record = item as Record<string, unknown>;
        const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        if (!slug || !title) {
          throw new Error(`Use-case response item ${index} had no valid slug or title.`);
        }
        const imageUrls = record.featured_image_urls;
        if (imageUrls != null && (!Array.isArray(imageUrls) || imageUrls.some((url) => typeof url !== 'string'))) {
          throw new Error(`Use-case response item ${index} had invalid featured image URLs.`);
        }
        return {
          slug,
          title,
          featured_image_urls: Array.isArray(imageUrls) ? imageUrls : undefined,
        };
      });
    }, []),
    loadHomeSection<BlogListEntry[]>('blog archive', locale, () => (
      fetchAllPublishedBlogPosts(
        buildFunctionsUrl,
        `Failed to fetch home blog archive posts for locale ${locale}`,
      )
    ), []),
  ]);

  const initialBlog = await loadHomeSection<BlogListItem[]>(
    'blog localization',
    locale,
    () => localizeBlogListItemSlugs(blogCards, blogArchive, locale),
    blogCards,
  );

  return { initialGallery, initialGallerySession, initialBlog, initialUseCases };
}
