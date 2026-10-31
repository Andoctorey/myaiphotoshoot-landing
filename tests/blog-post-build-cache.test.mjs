import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const inventory = [{
  slug: 'line-art-avatar',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-30T00:00:00Z',
  translations: { ru: { slug: 'kontur-avatar' } },
}];
const post = {
  id: 'line-art-avatar-id',
  slug: 'line-art-avatar',
  title: 'Line art avatar',
  content: '<p>Article content</p>',
  created_at: inventory[0].created_at,
  updated_at: inventory[0].updated_at,
  section_photos: {},
  translations: { ru: { slug: 'kontur-avatar', title: 'Контурный аватар' } },
};

async function loadModule(relativePath, dependencies, globals = {}) {
  const source = await readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const loadedModule = { exports: {} };
  new Function('exports', 'module', 'require', ...Object.keys(globals), outputText)(
    loadedModule.exports,
    loadedModule,
    (specifier) => dependencies[specifier] ?? require(specifier),
    ...Object.values(globals),
  );
  return loadedModule.exports;
}

async function createFixture(t, fetcher) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'blog-build-cache-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const warnings = [];
  const delays = [];
  const calls = [];
  const blogStaticParams = await loadModule('src/lib/blog-static-params.ts', {
    '@/i18n/request': { defaultLocale: 'en' },
  });
  const loadCache = () => loadModule('src/lib/blog-post-build-cache.ts', {
    'server-only': {},
    '@/lib/blog-static-params': {
      ...blogStaticParams,
      fetchPublishedBlogInventory: async () => inventory,
    },
  }, {
    process: { cwd: () => directory, pid: process.pid, env: { NODE_ENV: 'production' } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return fetcher(url, options, calls.length);
    },
    console: { warn: (...args) => warnings.push(args) },
    setTimeout: (callback, delayMs) => {
      delays.push(delayMs);
      queueMicrotask(callback);
    },
  });
  const buildFunctionsUrl = (endpoint, params) => {
    const url = new URL(`https://functions.example.test/functions/v1${endpoint}`);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  };
  const readPost = (cache) => cache.fetchLandingBlogPost(
    buildFunctionsUrl, 'ru', 'kontur-avatar', ['en', 'ru'], 'Blog page "ru/blog/kontur-avatar"',
  );
  return { cache: await loadCache(), loadCache, readPost, calls, delays, warnings };
}

test('a transient boot failure retries at the origin, shares the request, and caches only the recovered post', async (t) => {
  const fixture = await createFixture(t, async (_url, options, attempt) => {
    // Model Next's memoized failed GET: retries without a signal keep receiving the first failure.
    if (attempt === 1 || !options.signal) {
      return new Response('Function failed to start', {
        status: 503,
        headers: { 'sb-error-code': 'BOOT_ERROR', 'sb-request-id': 'request-1', 'cf-ray': 'ray-1' },
      });
    }
    return Response.json(post);
  });
  const [metadata, page] = await Promise.all([
    fixture.readPost(fixture.cache), fixture.readPost(fixture.cache),
  ]);
  assert.deepEqual(metadata, page);
  assert.deepEqual(page, { status: 200, post, slugMap: { en: 'line-art-avatar', ru: 'kontur-avatar' } });
  assert.equal(fixture.calls.length, 2);
  assert.deepEqual(fixture.delays, [500]);
  assert.match(fixture.warnings[0][0], /ru\/blog\/kontur-avatar.*HTTP 503; retrying/);
  assert.deepEqual(fixture.warnings[0][1], {
    attempt: 1, delayMs: 500, errorCode: 'BOOT_ERROR', requestId: 'request-1', cfRay: 'ray-1',
  });
  for (const { url, options } of fixture.calls) {
    assert.equal(new URL(url).searchParams.get('view'), 'landing-static');
    assert.equal(options.next.revalidate, 3600);
    assert.equal(options.cache, undefined, 'retries must preserve static export compatibility');
  }
  assert.deepEqual(await fixture.readPost(await fixture.loadCache()), page);
  assert.equal(fixture.calls.length, 2, 'the recovered compact post survives a new build worker');
});

test('gateway failures back off for at most three attempts and never cache an unavailable post', async (t) => {
  for (const status of [502, 503, 504]) {
    await t.test(String(status), async (t) => {
      let available = false;
      const fixture = await createFixture(t, async () => (
        available ? Response.json(post) : new Response('Unavailable', { status })
      ));
      const result = await fixture.readPost(fixture.cache);
      assert.equal(result.status, status);
      assert.equal(result.post, null);
      assert.equal(fixture.calls.length, 3);
      assert.deepEqual(fixture.delays, [500, 1000]);
      assert.match(fixture.warnings.at(-1)[0], new RegExp(`HTTP ${status}\\.$`));
      assert.notEqual(fixture.calls[1].options.signal, fixture.calls[2].options.signal);

      available = true;
      assert.equal((await fixture.readPost(await fixture.loadCache())).status, 200);
      assert.equal(fixture.calls.length, 4);
    });
  }
});

test('missing posts and permanent HTTP errors return immediately without retries', async (t) => {
  for (const status of [400, 401, 403, 404, 500]) {
    await t.test(String(status), async (t) => {
      const fixture = await createFixture(t, async () => new Response(null, { status }));
      assert.equal((await fixture.readPost(fixture.cache)).status, status);
      assert.equal(fixture.calls.length, 1);
      assert.deepEqual(fixture.delays, []);
    });
  }
});

test('a network failure can recover, and exhausted retries preserve the original error', async (t) => {
  const failure = new TypeError('fetch failed');
  const fixture = await createFixture(t, async (_url, _options, attempt) => {
    if (attempt !== 2) throw failure;
    return Response.json(post);
  });
  assert.equal((await fixture.readPost(fixture.cache)).status, 200);
  assert.equal(fixture.calls.length, 2);
  assert.equal(fixture.warnings[0][2], failure);

  const exhausted = await createFixture(t, async () => { throw failure; });
  await assert.rejects(exhausted.readPost(exhausted.cache), (error) => {
    assert.match(error.message, /ru\/blog\/kontur-avatar.*failed after 3 attempts/);
    assert.equal(error.cause, failure);
    return true;
  });
  assert.equal(exhausted.calls.length, 3);
});

test('malformed or invalid successful payloads still fail without retries or cached content', async (t) => {
  for (const response of [() => new Response('not JSON'), () => Response.json({ error: 'missing post' })]) {
    const fixture = await createFixture(t, response);
    await assert.rejects(fixture.readPost(fixture.cache));
    assert.equal(fixture.calls.length, 1);
    assert.deepEqual(fixture.delays, []);
  }
});
