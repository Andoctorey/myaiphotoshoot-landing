const SUPPORTED_LOCALES = new Set(['zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar']);
const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';

export async function canonicalizeLocalizedBlogAliasRequest(context, fixedLocale = null) {
  const { request, params, env } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next();
  }

  const route = getLocalizedBlogRoute(request, params, fixedLocale);
  if (!route) {
    return context.next();
  }

  const { locale, slug } = route;

  try {
    const canonicalSlug = await fetchCanonicalSlug({ env, locale, slug });
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
        'X-Redirect-By': 'localized-blog-slug',
      },
    });
  } catch (error) {
    console.warn('Failed to canonicalize localized blog slug alias:', error);
    return context.next();
  }
}

export function getLocalizedBlogRoute(request, params = {}, fixedLocale = null) {
  const routeParamSlug = typeof params.slug === 'string' ? params.slug : '';
  if (fixedLocale && SUPPORTED_LOCALES.has(fixedLocale) && routeParamSlug) {
    return {
      locale: fixedLocale,
      slug: routeParamSlug,
    };
  }

  const routeParamLocale = typeof params.locale === 'string' ? params.locale : '';
  if (!fixedLocale && SUPPORTED_LOCALES.has(routeParamLocale) && routeParamSlug) {
    return {
      locale: routeParamLocale,
      slug: routeParamSlug,
    };
  }

  // Root middleware and literal locale routes can miss dynamic params, so parse the same URL invariant.
  const { pathname } = new URL(request.url);
  const match = fixedLocale
    ? pathname.match(new RegExp(`^/${fixedLocale}/blog/([^/]+)/?$`))
    : pathname.match(/^\/([^/]+)\/blog\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }

  const locale = fixedLocale || match[1];
  const slug = fixedLocale ? match[1] : match[2];
  if (!SUPPORTED_LOCALES.has(locale) || !slug) {
    return null;
  }

  return { locale, slug };
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
