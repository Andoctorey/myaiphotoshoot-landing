import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

const functionSource = await readFile(
  new URL('../functions/[locale]/blog/[slug].js', import.meta.url),
  'utf8'
);
const functionModuleUrl = `data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`;
const {
  buildFunctionsUrl,
  canonicalizeLocalizedBlogRequest,
  fetchCanonicalSlug,
  getLocalizedBlogRoute,
  getLegacyEnglishSlug,
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
  assert.equal(response.headers.get('X-Redirect-By'), 'localized-blog-slug');
  assert.equal(nextCalls, 0);
});

test('redirects localized English slug aliases from root middleware without route params', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(
      url,
      'https://functions.example.test/functions/v1/blog-post?slug=greek-hero-portraits&locale=ru'
    );
    return Response.json({
      slug: 'greek-hero-portraits',
      translations: {
        ru: {
          slug: 'portrety-grecheskih-geroev',
        },
      },
    });
  };

  let nextCalls = 0;
  const response = await canonicalizeLocalizedBlogRequest({
    request: new Request('https://myaiphotoshoot.com/ru/blog/greek-hero-portraits/'),
    params: {},
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
    'https://myaiphotoshoot.com/ru/blog/portrety-grecheskih-geroev/'
  );
  assert.equal(response.headers.get('X-Redirect-By'), 'localized-blog-slug');
  assert.equal(nextCalls, 0);
});

test('redirects legacy localized slugs that no longer resolve directly', async () => {
  const requestedUrls = [];
  globalThis.fetch = async (url) => {
    requestedUrls.push(url);

    if (url === 'https://functions.example.test/functions/v1/blog-post?slug=biyo-portraito-retouch-guide&locale=ja') {
      return new Response('Not found', { status: 404 });
    }

    assert.equal(
      url,
      'https://functions.example.test/functions/v1/blog-post?slug=beauty-portrait-retouching&locale=ja'
    );
    return Response.json({
      slug: 'beauty-portrait-retouching',
      translations: {
        ja: {
          slug: '美容ポートレートレタッチガイド',
        },
      },
    });
  };

  let nextCalls = 0;
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/ja/blog/biyo-portraito-retouch-guide/'),
    params: {
      locale: 'ja',
      slug: 'biyo-portraito-retouch-guide',
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
    'https://myaiphotoshoot.com/ja/blog/%E7%BE%8E%E5%AE%B9%E3%83%9D%E3%83%BC%E3%83%88%E3%83%AC%E3%83%BC%E3%83%88%E3%83%AC%E3%82%BF%E3%83%83%E3%83%81%E3%82%AC%E3%82%A4%E3%83%89/'
  );
  assert.deepEqual(requestedUrls, [
    'https://functions.example.test/functions/v1/blog-post?slug=biyo-portraito-retouch-guide&locale=ja',
    'https://functions.example.test/functions/v1/blog-post?slug=beauty-portrait-retouching&locale=ja',
  ]);
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

test('maps legacy localized slugs back to their English source slugs', () => {
  assert.equal(getLegacyEnglishSlug('zh', '%E7%94%B5%E5%BD%B1%E5%A4%AA%E7%A9%BA%E7%85%A7%E7%89%87'), 'cinematic-space-photos');
  assert.equal(getLegacyEnglishSlug('es', 'fotos-de-tinder-hombres'), 'tinder-photos-men');
  assert.equal(getLegacyEnglishSlug('ru', 'idei-astro-portretov'), 'astro-portrait-ideas');
  assert.equal(getLegacyEnglishSlug('de', 'not-a-known-slug'), null);
});

test('parses localized blog routes from URLs when params are unavailable', () => {
  assert.deepEqual(
    getLocalizedBlogRoute(
      new Request('https://myaiphotoshoot.com/ru/blog/greek-hero-portraits/'),
      {}
    ),
    {
      locale: 'ru',
      slug: 'greek-hero-portraits',
    }
  );
  assert.equal(
    getLocalizedBlogRoute(
      new Request('https://myaiphotoshoot.com/blog/greek-hero-portraits/'),
      {}
    ),
    null
  );
});
