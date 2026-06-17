const SUPPORTED_LOCALES = new Set(['zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar']);
const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';

export async function onRequest(context) {
  const { request, params, env } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next();
  }

  const locale = typeof params.locale === 'string' ? params.locale : '';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  if (!SUPPORTED_LOCALES.has(locale) || !slug) {
    return context.next();
  }

  try {
    const canonicalSlug = await fetchCanonicalSlug({
      env,
      locale,
      slug,
    });

    if (!canonicalSlug || slugsMatch(slug, canonicalSlug)) {
      return context.next();
    }

    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/${locale}/blog/${canonicalSlug}/`;

    return new Response(null, {
      status: 308,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.warn('Failed to canonicalize localized blog slug alias:', error);
    return context.next();
  }
}

export async function fetchCanonicalSlug({ env, locale, slug }) {
  const functionsUrl = env?.SUPABASE_FUNCTIONS_URL
    || env?.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
    || DEFAULT_FUNCTIONS_URL;
  const url = buildFunctionsUrl(functionsUrl, '/blog-post', { slug, locale });
  const response = await fetch(url, {
    cf: {
      cacheEverything: true,
      cacheTtl: 3600,
    },
  });

  if (!response.ok) {
    return null;
  }

  const post = await response.json();
  if (!post || typeof post !== 'object') {
    return null;
  }

  const localizedSlug = post.translations?.[locale]?.slug;
  if (typeof localizedSlug === 'string' && localizedSlug.trim()) {
    return localizedSlug.trim();
  }

  return typeof post.slug === 'string' && post.slug.trim()
    ? post.slug.trim()
    : null;
}

export function buildFunctionsUrl(baseUrl, path, params) {
  const base = new URL(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = base.pathname.replace(/\/$/, '');
  base.pathname = `${basePath}${normalizedPath}`;

  const searchParams = new URLSearchParams(base.search);
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }
  base.search = searchParams.toString();

  return base.toString();
}

export function slugsMatch(left, right) {
  return decodeSlug(left) === decodeSlug(right);
}

function decodeSlug(slug) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
