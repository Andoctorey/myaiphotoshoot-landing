import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./use-cases-index.ts', import.meta.url), { encoding: 'utf8' });
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const { fetchUseCasesIndexItems } = await import(moduleUrl);
const functionsUrl = 'https://functions.example.test/functions/v1';
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('accepts a published catalog and a genuinely empty catalog', async () => {
  const item = {
    slug: 'ai-headshots',
    title: 'AI Headshots',
    featured_image_urls: ['https://images.example.test/headshots.webp'],
  };
  globalThis.fetch = async () => Response.json({ items: [item, { ...item, slug: null }] });
  assert.deepEqual(await fetchUseCasesIndexItems(functionsUrl, 'en'), [item]);

  globalThis.fetch = async () => Response.json({ items: [] });
  assert.deepEqual(await fetchUseCasesIndexItems(functionsUrl, 'en'), []);
});

test('rejects an HTTP failure with locale and status context', async () => {
  globalThis.fetch = async () => new Response('Service unavailable', { status: 503 });
  await assert.rejects(fetchUseCasesIndexItems(functionsUrl, 'fr'), (error) => {
    assert.match(error.message, /locale "fr"/);
    assert.match(error.cause.message, /status 503/);
    return true;
  });
});

test('preserves the original network error as the cause', async () => {
  const failure = new Error('Connection reset');
  globalThis.fetch = async () => {
    throw failure;
  };
  await assert.rejects(fetchUseCasesIndexItems(functionsUrl, 'de'), (error) => {
    assert.match(error.message, /locale "de"/);
    assert.equal(error.cause, failure);
    return true;
  });
});

test('rejects malformed JSON and a successful response without a catalog', async () => {
  globalThis.fetch = async () => new Response('not json');
  await assert.rejects(fetchUseCasesIndexItems(functionsUrl, 'en'), (error) => {
    assert.ok(error.cause instanceof SyntaxError);
    return true;
  });

  globalThis.fetch = async () => Response.json({ error: 'Catalog unavailable' });
  await assert.rejects(fetchUseCasesIndexItems(functionsUrl, 'en'), (error) => {
    assert.match(error.cause.message, /missing an items array/);
    return true;
  });
});

test('rejects malformed entries instead of silently omitting them', async () => {
  const valid = { slug: 'ai-headshots', title: 'AI Headshots' };
  for (const items of [[null], [valid, { slug: 'missing-title' }]]) {
    globalThis.fetch = async () => Response.json({ items });
    await assert.rejects(fetchUseCasesIndexItems(functionsUrl, 'es'), (error) => {
      assert.match(error.message, /locale "es"/);
      assert.match(error.cause.message, /invalid item at position/);
      return true;
    });
  }
});
