import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BlogPost } from '@/types/blog';
import {
  BLOG_REVALIDATE_SECONDS,
  type BuildFunctionsUrl,
  fetchPublishedBlogInventory,
  resolveBlogRoute,
} from '@/lib/blog-static-params';

const CACHE_VERSION = 1;
// Cloudflare Pages restores .next/cache between builds; match the existing fetch freshness contract.
const CACHE_MAX_AGE_MS = BLOG_REVALIDATE_SECONDS * 1000;
const CACHE_DIRECTORY = path.join(process.cwd(), '.next', 'cache', 'blog-content', `v${CACHE_VERSION}`);
const BLOG_FETCH_ATTEMPTS = 3;
const BLOG_RETRY_BASE_DELAY_MS = 500;

type CachedBlogPost = {
  version: number;
  revision: string;
  cachedAt: number;
  post: BlogPost;
};

export type LandingBlogPostResult = {
  status: number;
  post: BlogPost | null;
  slugMap: Record<string, string>;
};

const pendingBlogPosts = new Map<string, Promise<LandingBlogPostResult>>();
let warnedAboutCacheFailure = false;

function warnAboutCacheFailure(operation: string, error: unknown): void {
  if (warnedAboutCacheFailure) return;
  warnedAboutCacheFailure = true;
  console.warn(`Blog build cache ${operation} failed; continuing without the persistent cache.`, error);
}

function cacheFilePath(endpoint: string, locale: string, canonicalSlug: string): string {
  const key = createHash('sha256').update(`${endpoint}:${locale}:${canonicalSlug}`).digest('hex');
  return path.join(CACHE_DIRECTORY, `${key}.json`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBlogPost(value: unknown): value is BlogPost {
  if (!isRecord(value)) return false;
  const post = value as Partial<BlogPost>;
  return typeof post.id === 'string'
    && typeof post.slug === 'string'
    && typeof post.title === 'string'
    && typeof post.content === 'string'
    && typeof post.created_at === 'string'
    && typeof post.updated_at === 'string'
    && isRecord(post.translations);
}

function isCompactLandingPost(post: BlogPost): boolean {
  if (!isRecord(post.section_photos) || Object.keys(post.section_photos).length > 0) return false;

  return Object.values(post.translations ?? {}).every((translation) => (
    isRecord(translation)
    && !Object.hasOwn(translation, 'content')
    && !Object.hasOwn(translation, 'photo_topics')
  ));
}

async function readCachedBlogPost(
  filePath: string,
  revision: string,
): Promise<BlogPost | null> {
  try {
    const cached = JSON.parse(await readFile(filePath, 'utf8')) as Partial<CachedBlogPost>;
    const age = Date.now() - (cached.cachedAt ?? 0);
    if (
      cached.version !== CACHE_VERSION
      || cached.revision !== revision
      || age < 0
      || age > CACHE_MAX_AGE_MS
      || !isBlogPost(cached.post)
      || !isCompactLandingPost(cached.post)
    ) {
      return null;
    }
    return cached.post;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT' && !(error instanceof SyntaxError)) {
      warnAboutCacheFailure('read', error);
    }
    return null;
  }
}

async function writeCachedBlogPost(
  filePath: string,
  revision: string,
  post: BlogPost,
): Promise<void> {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    const cached: CachedBlogPost = {
      version: CACHE_VERSION,
      revision,
      cachedAt: Date.now(),
      post,
    };
    await writeFile(temporaryPath, JSON.stringify(cached));
    await rename(temporaryPath, filePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    warnAboutCacheFailure('write', error);
  }
}

async function fetchBlogPostWithRetry(url: string, context: string): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    const delayMs = BLOG_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
    let response: Response;
    try {
      response = await fetch(url, {
        next: { revalidate: BLOG_REVALIDATE_SECONDS },
        // Next.js memoizes failed GETs too; a signal makes retries reach the origin.
        ...(attempt > 1 ? { signal: new AbortController().signal } : {}),
      });
    } catch (error) {
      if (attempt >= BLOG_FETCH_ATTEMPTS) {
        throw new Error(`${context}: /blog-post request failed after ${attempt} attempts.`, { cause: error });
      }
      console.warn(`${context}: /blog-post request failed; retrying.`, { attempt, delayMs }, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    if (response.ok || response.status === 404) return response;

    const retry = [502, 503, 504].includes(response.status) && attempt < BLOG_FETCH_ATTEMPTS;
    console.warn(`${context}: /blog-post returned HTTP ${response.status}${retry ? '; retrying' : ''}.`, {
      attempt,
      ...(retry ? { delayMs } : {}),
      errorCode: response.headers.get('sb-error-code'),
      requestId: response.headers.get('sb-request-id'),
      cfRay: response.headers.get('cf-ray'),
    });
    if (!retry) return response;

    void response.body?.cancel().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

async function loadLandingBlogPost(
  buildFunctionsUrl: BuildFunctionsUrl,
  routeLocale: string,
  routeSlug: string,
  supportedLocales: readonly string[],
  context: string,
): Promise<LandingBlogPostResult> {
  const inventory = await fetchPublishedBlogInventory(buildFunctionsUrl, `${context} inventory`);
  const routeData = resolveBlogRoute(inventory, routeLocale, routeSlug, supportedLocales);
  if (!routeData) {
    return { status: 404, post: null, slugMap: {} };
  }
  const { post: inventoryPost, slugMap } = routeData;
  const revision = inventoryPost.updated_at || inventoryPost.created_at;
  const filePath = cacheFilePath(buildFunctionsUrl('/blog-post'), routeLocale, inventoryPost.slug);

  if (process.env.NODE_ENV === 'production') {
    const cachedPost = await readCachedBlogPost(filePath, revision);
    if (cachedPost) {
      return { status: 200, post: cachedPost, slugMap };
    }
  }

  const url = buildFunctionsUrl('/blog-post', {
    slug: routeSlug,
    locale: routeLocale,
    platform: 'web',
    view: 'landing-static',
  });
  const response = await fetchBlogPostWithRetry(url, context);
  if (!response.ok) {
    return { status: response.status, post: null, slugMap };
  }

  const payload: unknown = await response.json();
  if (!isBlogPost(payload)) {
    throw new Error(`${context} returned an invalid blog post payload.`);
  }

  if (process.env.NODE_ENV === 'production' && isCompactLandingPost(payload)) {
    await writeCachedBlogPost(filePath, revision, payload);
  }

  return { status: response.status, post: payload, slugMap };
}

export function fetchLandingBlogPost(
  buildFunctionsUrl: BuildFunctionsUrl,
  routeLocale: string,
  routeSlug: string,
  supportedLocales: readonly string[],
  context: string,
): Promise<LandingBlogPostResult> {
  const key = `${buildFunctionsUrl('/blog-post')}:${routeLocale}:${routeSlug}`;
  const pending = pendingBlogPosts.get(key);
  if (pending) return pending;

  const request = loadLandingBlogPost(
    buildFunctionsUrl,
    routeLocale,
    routeSlug,
    supportedLocales,
    context,
  );
  pendingBlogPosts.set(key, request);
  void request.then(
    () => pendingBlogPosts.delete(key),
    () => pendingBlogPosts.delete(key),
  );
  return request;
}
