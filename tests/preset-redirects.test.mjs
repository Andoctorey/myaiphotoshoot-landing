import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/_middleware.js';

test('historical preset URLs redirect before the missing static page is requested', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request'); });
  for (const [oldSlug, currentSlug] of [['quiet-photo-restore', 'old-photo-restore'], ['ai-yearbook', 'yearbook']]) {
    for (const locale of ['', 'en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar']) {
      const prefix = locale ? `/${locale}` : '';
      const request = new Request(`https://myaiphotoshoot.com${prefix}/presets/${oldSlug}/`);
      const response = await onRequest({
        request,
        env: {},
        next: async () => { throw new Error('Legacy URL reached static lookup'); },
      });
      const canonicalPrefix = locale && locale !== 'en' ? `/${locale}` : '';
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), `https://myaiphotoshoot.com${canonicalPrefix}/presets/${currentSlug}/`);
      assert.equal(response.headers.get('set-cookie'), null);
    }
  }
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/en/presets/ai-yearbook?utm_source=google', { method: 'HEAD' }),
    env: {},
    next: async () => { throw new Error('Legacy URL reached static lookup'); },
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://myaiphotoshoot.com/presets/yearbook/?utm_source=google');
  assert.equal(fetch.mock.callCount(), 0);
});

test('current, unknown and unrelated preset URLs keep their normal response', async () => {
  for (const [path, method, status] of [
    ['/es/presets/old-photo-restore/', 'GET', 200],
    ['/ru/presets/yearbook/', 'GET', 200],
    ['/fr/presets/rooftop-court/', 'GET', 404],
    ['/xx/presets/ai-yearbook/', 'GET', 404],
    ['/photo/ai-yearbook/', 'GET', 404],
    ['/es/presets/ai-yearbook/', 'POST', 404],
  ]) {
    const response = new Response('original response', { status, headers: { 'content-type': 'text/html' } });
    const result = await onRequest({
      request: new Request(`https://myaiphotoshoot.com${path}`, { method }),
      env: {},
      next: async () => response,
    });
    assert.equal(result, response);
  }
});
