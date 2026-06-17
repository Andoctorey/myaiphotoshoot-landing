import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

const functionSource = await readFile(
  new URL('./[locale]/blog/[slug].js', import.meta.url),
  'utf8'
);
const functionModuleUrl = `data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`;
const {
  buildFunctionsUrl,
  fetchCanonicalSlug,
  onRequest,
  slugsMatch,
} = await import(functionModuleUrl);

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
});

test('redirects localized English slug aliases to the translated canonical slug', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(
      url,
      'https://functions.example.test/functions/v1/blog-post?slug=vintage-photo-ideas&locale=de'
    );
    return Response.json({
      slug: 'vintage-photo-ideas',
      translations: {
        de: {
          slug: 'vintage-foto-ideen',
        },
      },
    });
  };

  let nextCalls = 0;
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/de/blog/vintage-photo-ideas/?utm_source=test'),
    params: {
      locale: 'de',
      slug: 'vintage-photo-ideas',
    },
    env: {
      SUPABASE_FUNCTIONS_URL: 'https://functions.example.test/functions/v1',
    },
    next: async () => {
      nextCalls += 1;
      return new Response('static');
    },
  });

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get('Location'),
    'https://myaiphotoshoot.com/de/blog/vintage-foto-ideen/?utm_source=test'
  );
  assert.equal(nextCalls, 0);
});

test('passes canonical localized slugs through to static assets', async () => {
  globalThis.fetch = async () => Response.json({
    slug: 'vintage-photo-ideas',
    translations: {
      de: {
        slug: 'vintage-foto-ideen',
      },
    },
  });

  let nextCalls = 0;
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/de/blog/vintage-foto-ideen/'),
    params: {
      locale: 'de',
      slug: 'vintage-foto-ideen',
    },
    env: {},
    next: async () => {
      nextCalls += 1;
      return new Response('static');
    },
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'static');
  assert.equal(nextCalls, 1);
});

test('fails open when canonical lookup fails', async () => {
  globalThis.fetch = async () => {
    throw new Error('network unavailable');
  };
  let warnCalls = 0;
  console.warn = () => {
    warnCalls += 1;
  };

  let nextCalls = 0;
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/de/blog/vintage-photo-ideas/'),
    params: {
      locale: 'de',
      slug: 'vintage-photo-ideas',
    },
    env: {},
    next: async () => {
      nextCalls += 1;
      return new Response('static fallback');
    },
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'static fallback');
  assert.equal(nextCalls, 1);
  assert.equal(warnCalls, 1);
});

test('builds function URLs without dropping base query parameters', () => {
  assert.equal(
    buildFunctionsUrl('https://functions.example.test/functions/v1?apikey=abc', '/blog-post', {
      slug: 'photo-ideas',
      locale: 'fr',
    }),
    'https://functions.example.test/functions/v1/blog-post?apikey=abc&slug=photo-ideas&locale=fr'
  );
});

test('compares encoded and decoded slugs as equal', () => {
  assert.equal(slugsMatch('%E7%94%B7%E5%A3%AB', '男士'), true);
});

test('uses the localized slug when resolving canonical slug', async () => {
  globalThis.fetch = async () => Response.json({
    slug: 'line-art-avatar',
    translations: {
      zh: {
        slug: '线条艺术头像',
      },
    },
  });

  const slug = await fetchCanonicalSlug({
    env: {},
    locale: 'zh',
    slug: 'line-art-avatar',
  });

  assert.equal(slug, '线条艺术头像');
});
