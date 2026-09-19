const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';
const GALLERY_URL = 'https://myaiphotoshoot.com/gallery/';
const PAGE_SIZE = 100;
const MAX_IMAGES = 1000;
const GALLERY_IMAGE_WIDTH = 420;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function responseHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'public, max-age=300, s-maxage=86400',
    'x-content-type-options': 'nosniff',
  };
}

function createCacheKey(request) {
  return new Request(request.url, { method: 'GET' });
}

async function getCachedResponse(request) {
  if (typeof caches === 'undefined') return null;
  return caches.default.match(createCacheKey(request));
}

async function cacheResponse(context, response) {
  if (typeof caches === 'undefined') return;
  const cacheWrite = caches.default.put(createCacheKey(context.request), response.clone());
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(cacheWrite);
  } else {
    await cacheWrite;
  }
}

async function fetchGalleryPage(functionsUrl, page) {
  const url = new URL(`${functionsUrl.replace(/\/$/, '')}/public-gallery`);
  url.search = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: 'popular',
    platform: 'web',
  }).toString();

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`public-gallery page ${page} returned ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`public-gallery page ${page} returned an invalid response`);
  }
  return data;
}

function buildImageSitemap(pages) {
  const imageUrls = [];
  const seenUrls = new Set();

  for (const photo of pages.flat()) {
    if (imageUrls.length >= MAX_IMAGES) break;
    const publicUrl = typeof photo?.public_url === 'string' ? photo.public_url.trim() : '';
    if (!publicUrl.startsWith('https://')) continue;
    const imageUrl = publicUrl.includes('supabase.co') || /([?&])width=\d+/i.test(publicUrl)
      ? publicUrl
      : `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}width=${GALLERY_IMAGE_WIDTH}`;
    if (seenUrls.has(imageUrl)) continue;
    seenUrls.add(imageUrl);
    imageUrls.push(imageUrl);
  }

  if (imageUrls.length === 0) {
    throw new Error('public-gallery returned no valid image URLs');
  }

  const images = imageUrls
    .map((imageUrl) => `    <image:image><image:loc>${escapeXml(imageUrl)}</image:loc></image:image>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${GALLERY_URL}</loc>
${images}
  </url>
</urlset>\n`;
}

export async function onRequest(context) {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        ...responseHeaders('text/plain; charset=utf-8'),
        allow: 'GET, HEAD',
      },
    });
  }

  const functionsUrl = context.env.SUPABASE_FUNCTIONS_URL
    || context.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
    || DEFAULT_FUNCTIONS_URL;

  try {
    const cachedResponse = await getCachedResponse(context.request);
    if (cachedResponse) {
      return context.request.method === 'HEAD'
        ? new Response(null, cachedResponse)
        : cachedResponse;
    }

    const pageCount = Math.ceil(MAX_IMAGES / PAGE_SIZE);
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, index) => fetchGalleryPage(functionsUrl, index + 1)),
    );
    const sitemap = buildImageSitemap(pages);

    const response = new Response(context.request.method === 'HEAD' ? null : sitemap, {
      headers: responseHeaders('application/xml; charset=utf-8'),
    });
    await cacheResponse(context, new Response(sitemap, {
      status: response.status,
      headers: response.headers,
    }));
    return response;
  } catch (error) {
    console.error('Failed to build image sitemap', { error });
    return new Response('Unable to build image sitemap', {
      status: 502,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  }
}
