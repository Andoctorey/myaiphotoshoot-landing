import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

const functionSource = await readFile(
  new URL('../functions/image-sitemap.xml.js', import.meta.url),
  'utf8',
);
const functionModuleUrl = `data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`;
const { onRequest } = await import(functionModuleUrl);

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const originalConsoleError = console.error;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalCaches === undefined) {
    delete globalThis.caches;
  } else {
    globalThis.caches = originalCaches;
  }
});

function request(method = 'GET') {
  return new Request('https://myaiphotoshoot.com/image-sitemap.xml', { method });
}

test('returns up to 1,000 unique popular gallery images as XML', async () => {
  const requestedPages = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    const page = Number(url.searchParams.get('page'));
    requestedPages.push(page);
    assert.equal(url.searchParams.get('limit'), '100');
    assert.equal(url.searchParams.get('sort'), 'popular');
    assert.equal(url.searchParams.get('platform'), 'web');

    return Response.json(Array.from({ length: 100 }, (_, index) => ({
      public_url: `https://cdn.myaiphotoshoot.com/photo-${page}-${index}.webp`,
    })));
  };

  const response = await onRequest({ request: request(), env: {} });
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/xml; charset=utf-8');
  assert.match(response.headers.get('cache-control'), /s-maxage=86400/);
  assert.deepEqual(requestedPages.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal((xml.match(/<image:image>/g) ?? []).length, 1000);
  assert.match(xml, /<loc>https:\/\/myaiphotoshoot\.com\/gallery\/<\/loc>/);
  assert.match(xml, /photo-1-0\.webp\?width=420/);
});

test('escapes image URLs and removes duplicates or invalid URLs', async () => {
  globalThis.fetch = async (input) => {
    const page = Number(new URL(input).searchParams.get('page'));
    return Response.json(page === 1 ? [
      { public_url: 'https://cdn.myaiphotoshoot.com/photo.webp?width=100&quality=80' },
      { public_url: 'https://cdn.myaiphotoshoot.com/photo.webp?width=100&quality=80' },
      { public_url: 'https://example.supabase.co/storage/v1/object/public/photo.webp' },
      { public_url: 'http://cdn.myaiphotoshoot.com/insecure.webp' },
      { public_url: '' },
    ] : []);
  };

  const response = await onRequest({ request: request(), env: {} });
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.equal((xml.match(/<image:image>/g) ?? []).length, 2);
  assert.match(xml, /width=100&amp;quality=80/);
  assert.match(xml, /example\.supabase\.co\/storage\/v1\/object\/public\/photo\.webp/);
  assert.doesNotMatch(xml, /example\.supabase\.co[^<]*width=420/);
});

test('does not publish a partial sitemap when an upstream page fails', async () => {
  console.error = () => {};
  globalThis.fetch = async (input) => {
    const page = Number(new URL(input).searchParams.get('page'));
    return page === 4
      ? new Response('failure', { status: 503 })
      : Response.json([]);
  };

  const response = await onRequest({ request: request(), env: {} });

  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('supports HEAD and rejects other methods', async () => {
  globalThis.fetch = async () => Response.json([
    { public_url: 'https://cdn.myaiphotoshoot.com/photo.webp' },
  ]);

  const headResponse = await onRequest({ request: request('HEAD'), env: {} });
  assert.equal(headResponse.status, 200);
  assert.equal(await headResponse.text(), '');

  const postResponse = await onRequest({ request: request('POST'), env: {} });
  assert.equal(postResponse.status, 405);
  assert.equal(postResponse.headers.get('allow'), 'GET, HEAD');
});

test('reuses the Cloudflare cache instead of refetching gallery pages', async () => {
  const cacheEntries = new Map();
  globalThis.caches = {
    default: {
      async match(cacheKey) {
        return cacheEntries.get(cacheKey.url)?.clone();
      },
      async put(cacheKey, response) {
        cacheEntries.set(cacheKey.url, response.clone());
      },
    },
  };

  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return Response.json([
      { public_url: `https://cdn.myaiphotoshoot.com/photo-${fetchCalls}.webp` },
    ]);
  };

  const firstResponse = await onRequest({ request: request(), env: {} });
  const secondResponse = await onRequest({ request: request(), env: {} });

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(fetchCalls, 10);
  assert.equal(await secondResponse.text(), await firstResponse.text());
});

test('deployment routes and robots.txt advertise the image sitemap', async () => {
  const [routes, robotsSource] = await Promise.all([
    readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/robots.ts', import.meta.url), 'utf8'),
  ]);

  assert.ok(JSON.parse(routes).include.includes('/image-sitemap.xml'));
  assert.match(robotsSource, /https:\/\/myaiphotoshoot\.com\/image-sitemap\.xml/);
});
