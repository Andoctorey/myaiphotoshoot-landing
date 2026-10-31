import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);

/**
 * @typedef {{
 *   'src/lib/fetcher.ts': typeof import('../src/lib/fetcher'),
 *   'src/lib/ai-mask-landings.ts': typeof import('../src/lib/ai-mask-landings'),
 *   'src/app/api/support/route.ts': typeof import('../src/app/api/support/route'),
 *   'src/app/[locale]/gallery-data/route.ts': typeof import('../src/app/[locale]/gallery-data/route')
 * }} TestModules
 */

/**
 * @template {keyof TestModules} P
 * @param {P} file
 * @param {Record<string, unknown>} [dependencies]
 * @returns {Promise<TestModules[P]>}
 */
async function loadModule(file, dependencies = {}) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), { encoding: 'utf8' });
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loadedModule = { exports: {} };
  const localRequire = (name) => dependencies[name] ?? (name === '@/lib/env'
    ? { env: { SUPABASE_FUNCTIONS_URL: 'https://functions.example.test' } }
    : name === '@/lib/cache' ? { withRevalidate: () => ({ next: { revalidate: 3600 } }) } : require(name));
  return new Function('module', 'exports', 'require', `${outputText}\nreturn module.exports;`)(
    loadedModule, loadedModule.exports, localRequire,
  );
}

const { fetcher } = await loadModule('src/lib/fetcher.ts');

function mockRequestTimers(t) {
  const timers = [];
  const cleared = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    const timer = { callback, delay };
    timers.push(timer);
    return timer;
  });
  t.mock.method(globalThis, 'clearTimeout', (timer) => cleared.push(timer));
  return { timers, cleared };
}

test('the fetcher returns JSON and clears its timeout after reading the body', async (t) => {
  const { timers, cleared } = mockRequestTimers(t);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ items: [] }));
  assert.deepEqual(await fetcher('https://api.example.test'), { items: [] });
  assert.equal(timers[0].delay, 10000);
  assert.deepEqual(cleared, timers);
});

test('the fetcher preserves HTTP, network and JSON failures and always clears its timeout', async (t) => {
  const { timers, cleared } = mockRequestTimers(t);
  const networkError = new TypeError('Connection reset');
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(null, {
    status: 503, statusText: 'Service Unavailable',
  }));
  await assert.rejects(fetcher('https://api.example.test'), /Failed to fetch: 503 Service Unavailable/);
  fetch.mock.mockImplementation(async () => { throw networkError; });
  await assert.rejects(fetcher('https://api.example.test'), (error) => error === networkError);
  fetch.mock.mockImplementation(async () => new Response('not JSON'));
  await assert.rejects(fetcher('https://api.example.test'), SyntaxError);
  assert.deepEqual(cleared, timers);
});

for (const phase of ['request', 'body']) {
  test(`the fetcher times out during the ${phase} and preserves the abort cause`, async (t) => {
    const { timers, cleared } = mockRequestTimers(t);
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    let signal;
    let started;
    const pending = new Promise((resolve) => { started = resolve; });
    t.mock.method(globalThis, 'fetch', async (_url, init) => {
      signal = init.signal;
      const waitForAbort = () => {
        started();
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(abortError), { once: true });
        });
      };
      return phase === 'request' ? waitForAbort() : { ok: true, json: waitForAbort };
    });
    const request = fetcher('https://api.example.test');
    const rejected = assert.rejects(request, (error) => {
      assert.equal(error.message, 'Request timed out');
      assert.equal(error.cause, abortError);
      return true;
    });
    await pending;
    assert.equal(cleared.length, 0, 'the timeout must remain active until the body finishes');
    timers[0].callback();
    await rejected;
    assert.equal(signal.aborted, true);
    assert.deepEqual(cleared, timers);
  });
}

test('support and gallery routes preserve their public error responses and log failures once', async (t) => {
  const support = await loadModule('src/app/api/support/route.ts');
  const gallery = await loadModule('src/app/[locale]/gallery-data/route.ts');
  const log = t.mock.method(console, 'error', () => {});
  const upstream = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  const supportRequest = () => new Request('https://landing.example.test/api/support', {
    method: 'POST', body: JSON.stringify({ email: 'test@example.test', message: 'Help' }),
  });
  const handlers = [
    { run: () => support.POST(supportRequest()), message: 'Failed to send support request' },
    { run: () => gallery.GET(), message: 'Failed to fetch gallery data' },
  ];
  for (const { run, message } of handlers) {
    const response = await run();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: message });
    assert.deepEqual(log.mock.calls.at(-1).arguments[1], { status: 503 });
  }
  assert.equal(log.mock.callCount(), 2);

  const failure = new TypeError('Connection reset');
  upstream.mock.mockImplementation(async () => { throw failure; });
  for (const { run, message } of handlers) {
    const response = await run();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: message });
    assert.equal(log.mock.calls.at(-1).arguments[1], failure);
  }
  assert.equal(log.mock.callCount(), 4);
});

test('mask landing JSON errors preserve their cause while missing RPCs still omit landings', async (t) => {
  let status = 200;
  const api = await loadModule('src/lib/ai-mask-landings.ts', {
    '@/i18n/request': { defaultLocale: 'en', locales: ['en'] },
    '@/lib/ai-masks': {},
    '@/lib/ai-mask-landing-validation': {},
    '@/lib/public-supabase': {
      postPublicSupabaseRpc: async () => new Response('not JSON', { status }),
    },
    '@/lib/seo': {},
  });
  await assert.rejects(api.fetchPublishedMaskCategoryLandings('en'), (error) => {
    assert.match(error.message, /locale "en"/);
    assert.equal(error.cause.message, 'RPC response was not valid JSON.');
    assert.ok(error.cause.cause instanceof SyntaxError);
    return true;
  });

  status = 404;
  const warn = t.mock.method(console, 'warn', () => {});
  assert.deepEqual(await api.fetchPublishedMaskCategoryLandings('en'), []);
  assert.deepEqual(await api.fetchPublishedMaskCategoryLandings('en'), []);
  assert.equal(warn.mock.callCount(), 1);
});
