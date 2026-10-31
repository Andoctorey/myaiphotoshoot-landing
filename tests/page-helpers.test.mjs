import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

const locales = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];
const functionsUrl = 'https://functions.example.test/functions/v1';

/**
 * @typedef {{
 *   'functions-url': typeof import('../src/lib/functions-url'),
 *   'blog-index': typeof import('../src/lib/blog-index'),
 *   'blog-post-metadata': typeof import('../src/lib/blog-post-metadata'),
 *   'use-cases-labels': typeof import('../src/lib/use-cases-labels'),
 *   'seo': typeof import('../src/lib/seo'),
 *   'blog-static-params': typeof import('../src/lib/blog-static-params')
 * }} TestModules
 */

/**
 * @template {keyof TestModules} P
 * @param {P} name
 * @param {Record<string, unknown>} [dependencies]
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<TestModules[P]>}
 */
async function loadHelper(name, dependencies = {}, fetchImpl = async () => { throw new Error('Unexpected request'); }) {
  const source = await readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), { encoding: 'utf8' });
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (specifier) => {
    if (!(specifier in dependencies)) throw new Error(`Unexpected dependency: ${specifier}`);
    return dependencies[specifier];
  };
  return compileFunction(`${code}\nreturn exports;`, ['exports', 'require', 'fetch'])(
    {}, localRequire, fetchImpl,
  );
}

const dependencies = {
  '@/lib/env': { env: { SUPABASE_FUNCTIONS_URL: functionsUrl } },
  '@/i18n/request': { defaultLocale: 'en', locales },
  '@/lib/seo': await loadHelper('seo'),
};
dependencies['@/lib/functions-url'] = await loadHelper('functions-url', dependencies);
dependencies['@/lib/blog-static-params'] = await loadHelper('blog-static-params', dependencies);

/** @type {import('../src/types/blog').BlogPost} */
const post = {
  id: 'portrait-id', slug: 'portrait', title: 'Portrait ideas',
  content: '<p>Full article</p>', photo_topics: 'Portraits, bad.tag, X, Lighting', status: 'published',
  created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-02T00:00:00Z',
  meta_description: 'Portrait examples', featured_image_url: 'https://cdn.example.test/portrait.JPEG?width=1200',
  section_photos: {}, translations: { de: { slug: 'portraet', title: 'Porträtideen' } },
};

test('shared function URLs retain the base path and query parameters', async () => {
  const { buildFunctionsUrl } = await loadHelper('functions-url', {
    '@/lib/env': { env: { SUPABASE_FUNCTIONS_URL: `${functionsUrl}/?keep=1&locale=en` } },
  });
  const url = new URL(buildFunctionsUrl('blog-post', { slug: '写真', locale: 'ja' }));
  assert.equal(url.pathname, '/functions/v1/blog-post');
  assert.equal(url.searchParams.get('keep'), '1');
  assert.equal(url.searchParams.get('locale'), 'ja');
  assert.equal(url.searchParams.get('slug'), '写真');
  assert.equal(buildFunctionsUrl('/blog-post'), `${functionsUrl}/blog-post?keep=1&locale=en`);
});

test('blog metadata retains canonical aliases, language alternates and article image details', async () => {
  const { buildBlogPostMetadata } = await loadHelper('blog-post-metadata', dependencies);
  const metadata = buildBlogPostMetadata(post, {
    locale: 'de', canonicalSlug: 'portraet', defaultSlug: 'portrait',
    slugMap: { en: 'portrait', de: 'portraet' }, indexable: false,
  });
  assert.equal(metadata.alternates.canonical, 'https://myaiphotoshoot.com/de/blog/portraet/');
  assert.deepEqual(metadata.alternates.languages, {
    en: '/blog/portrait/', de: '/de/blog/portraet/', 'x-default': '/blog/portrait/',
  });
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.googleBot.index, false);
  assert.equal(metadata.robots.follow, true);
  assert.deepEqual(metadata.openGraph.tags, ['Portraits', 'Lighting']);
  assert.deepEqual(metadata.openGraph.images[0], {
    url: post.featured_image_url, alt: post.title, type: 'image/jpeg',
  });
  assert.equal(metadata.openGraph.publishedTime, post.created_at);
  assert.equal(metadata.openGraph.modifiedTime, post.updated_at);
  assert.equal(metadata.twitter.images[0].alt, post.title);
  assert.equal(metadata.other['og:image:alt'], post.title);

  const fallback = buildBlogPostMetadata({ ...post, featured_image_url: null, photo_topics: null }, {
    locale: 'en', canonicalSlug: 'portrait', defaultSlug: 'portrait', slugMap: { en: 'portrait' }, indexable: true,
  });
  assert.equal(fallback.alternates.canonical, 'https://myaiphotoshoot.com/blog/portrait/');
  assert.equal(fallback.robots.index, true);
  assert.equal(fallback.openGraph.images[0].url, 'https://myaiphotoshoot.com/og-image-v2.jpg?v=8');
  assert.deepEqual(fallback.openGraph.tags, ['AI photography']);
});

test('blog index metadata and use-case labels retain translated copy and defaults', async () => {
  const { buildBlogIndexMetadata } = await loadHelper('blog-index', dependencies);
  const { getUseCasesLabels } = await loadHelper('use-cases-labels');
  for (const locale of locales) {
    const messages = JSON.parse(await readFile(new URL(`../messages/${locale}/index.json`, import.meta.url), { encoding: 'utf8' }));
    const metadata = buildBlogIndexMetadata(locale, messages);
    assert.equal(metadata.title, messages.blog.title);
    assert.equal(metadata.description, messages.blog.description);
    assert.equal(metadata.alternates.canonical, `https://myaiphotoshoot.com${locale === 'en' ? '' : `/${locale}`}/blog/`);
    assert.equal(getUseCasesLabels(messages).title, messages.pageCopy.useCases.title);
  }
  assert.equal(buildBlogIndexMetadata('en', {}).title, 'AI Photo Blog');
  assert.equal(getUseCasesLabels({}).emptyLabel, 'No use cases yet');
});

test('blog index data retains English and localized titles, slugs and compact cards', async () => {
  const api = await loadHelper('blog-index', {
    ...dependencies,
    '@/lib/blog-static-params': {
      ...dependencies['@/lib/blog-static-params'],
      fetchAllPublishedBlogPosts: async () => [post],
    },
  }, async () => Response.json({ posts: [post], total: 1, page: 1, limit: 12, totalPages: 1 }));
  const english = await api.fetchBlogIndexData('en');
  const german = await api.fetchBlogIndexData('de', { localized: true });
  assert.deepEqual(english.archivePosts, [{ slug: 'portrait', title: 'Portrait ideas' }]);
  assert.deepEqual(german.archivePosts, [{ slug: 'portraet', title: 'Porträtideen' }]);
  assert.equal(german.initialPosts[0].slug, 'portraet');
  assert.equal(Object.hasOwn(german.initialPosts[0], 'content'), false);
  assert.deepEqual(german.initialPagination, { total: 1, page: 1, limit: 12, totalPages: 1 });
});

test('a failed blog page still retains its archive while invalid page JSON uses the client fallback', async () => {
  const mocks = {
    ...dependencies,
    '@/lib/blog-static-params': {
      ...dependencies['@/lib/blog-static-params'],
      fetchAllPublishedBlogPosts: async () => [post],
    },
  };
  const unavailable = await loadHelper('blog-index', mocks, async () => { throw new Error('Connection reset'); });
  const fallback = await unavailable.fetchBlogIndexData('de', { localized: true });
  assert.deepEqual(fallback.initialPosts, []);
  assert.equal(fallback.initialPagination, undefined);
  assert.deepEqual(fallback.archivePosts, [{ slug: 'portraet', title: 'Porträtideen' }]);
  const malformed = await loadHelper('blog-index', mocks, async () => new Response('not JSON'));
  assert.deepEqual(await malformed.fetchBlogIndexData('de', { localized: true }), {
    initialPosts: [], initialPagination: undefined, archivePosts: [],
  });
});
