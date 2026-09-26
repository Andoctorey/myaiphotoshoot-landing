import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const source = await readFile(new URL('../functions/preset-test.js', import.meta.url), 'utf8');
const { onRequest: handleRequest, experimentConsentAllowed } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const env = { SUPABASE_URL: 'https://backend.example', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' };
const onRequest = context => handleRequest({ env, ...context });
const presetId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const visitorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const assignment = { assignment_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', featured_graphics: 'https://example.com/b.jpg', featured_graphics_alt: 'Preview B', cost_credits: 19 };

function request(path = `?presetId=${presetId}`, init = {}, country = 'US') {
  const headers = new Headers(init.headers);
  if (!headers.has('cf-connecting-ip')) headers.set('cf-connecting-ip', '192.0.2.1');
  const value = new Request(`https://example.com/preset-test${path}`, { ...init, headers });
  Object.defineProperty(value, 'cf', { value: { country } });
  return value;
}

function mockBackend(t, handler) {
  return t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
    assert.equal(init.headers.authorization, `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
    if (url.endsWith('/consume_global_rate_limit')) {
      const body = JSON.parse(init.body);
      assert.match(body.p_subject, /^preset-test:[a-f\d]{64}$/);
      assert.equal(body.p_limit, 60);
      assert.equal(body.p_window_seconds, 60);
      return Response.json({ allowed: true, retry_after_seconds: 0 });
    }
    if (url.endsWith('/assign_ai_preset_tests_rate_limited')) {
      assert.match(JSON.parse(init.body).p_subject, /^preset-test:[a-f\d]{64}$/);
      const response = await handler(url, init);
      return Response.json({ allowed: true, retry_after_seconds: 0, assignments: await response.json() });
    }
    return handler(url, init);
  });
}

test('experiment consent matches the existing EEA/UK choice and fails closed for unknown geography', () => {
  for (const country of ['GB', 'DE', 'NO', 'XX', 'T1', undefined, '']) assert.equal(experimentConsentAllowed('', country), false);
  assert.equal(experimentConsentAllowed('', 'US'), true);
  assert.equal(experimentConsentAllowed('accepted', 'DE'), true);
  assert.equal(experimentConsentAllowed('rejected', 'US'), false);
});

test('first assignment sets a private secure visitor cookie and never caches the preview', async (t) => {
  let visitor;
  const backend = mockBackend(t, async (url, init) => {
    assert.equal(url, 'https://backend.example/rest/v1/rpc/assign_ai_preset_tests_rate_limited');
    const body = JSON.parse(init.body);
    assert.deepEqual(body.p_preset_ids, [presetId]);
    visitor = body.p_visitor_id;
    assert.match(visitor, /^[a-f\d-]{36}$/i);
    return Response.json({ [presetId]: assignment });
  });
  const response = await onRequest({ request: request() });
  assert.deepEqual(await response.json(), assignment);
  assert.match(response.headers.get('set-cookie'), new RegExp(`preset_test_visitor=${visitor};`));
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  assert.equal(backend.mock.callCount(), 1, 'rate limiting and assignment use one round trip');
});

test('repeat visits reuse the browser ID across preset experiments', async (t) => {
  mockBackend(t, async (_url, init) => {
    assert.equal(JSON.parse(init.body).p_visitor_id, visitorId);
    return Response.json({ [presetId]: assignment });
  });
  const response = await onRequest({ request: request(undefined, { headers: { cookie: `other=1; preset_test_visitor=${visitorId}` } }) });
  assert.equal(response.status, 200);
});

test('one batch assignment request covers a preset grid page', async (t) => {
  const backend = mockBackend(t, async (url, init) => {
    assert.match(url, /\/assign_ai_preset_tests_rate_limited$/);
    const body = JSON.parse(init.body);
    assert.deepEqual(body, {
      p_preset_ids: [presetId], p_visitor_id: visitorId, p_subject: body.p_subject,
    });
    return Response.json({ [presetId]: assignment });
  });
  const response = await onRequest({ request: request(`?presetIds=${presetId}&consent=accepted`, {
    headers: { cookie: `preset_test_visitor=${visitorId}` },
  }) });
  assert.deepEqual(await response.json(), { [presetId]: assignment });
  assert.match(response.headers.get('set-cookie'), new RegExp(`preset_test_visitor=${visitorId}`));
  assert.equal(backend.mock.callCount(), 1);
});

test('no running test leaves the page canonical without setting a tracking cookie', async (t) => {
  mockBackend(t, async () => Response.json({}));
  const response = await onRequest({ request: request() });
  assert.equal(await response.json(), null);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('x-preset-test-resolved'), '1');
});

test('single preset lookup preserves assignments when the UUID uses uppercase letters', async (t) => {
  mockBackend(t, async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body).p_preset_ids, [presetId]);
    return Response.json({ [presetId]: assignment });
  });
  const response = await onRequest({ request: request(`?presetId=${presetId.toUpperCase()}`) });
  assert.deepEqual(await response.json(), assignment);
});

test('invalid combined RPC results cannot be cached as a confirmed no-test result', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const assignments of [null, [], 'invalid']) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ allowed: true, assignments }));
    const response = await onRequest({ request: request() });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('x-preset-test-resolved'), null);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(fetch.mock.callCount(), 1);
    fetch.mock.restore();
  }
});

test('opt out and unresolved consent clear the cookie without contacting Supabase', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const req of [request('?consent=rejected'), request(undefined, {}, 'DE'), request('', { method: 'DELETE' }),
    request('?consent=accepted', { headers: { cookie: 'preset_test_consent=rejected' } })]) {
    const response = await onRequest({ request: req });
    assert.equal(await response.json(), null);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal(response.headers.get('x-preset-test-resolved'), null);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('click and exposure events require the browser cookie and use the visitor-bound RPC', async (t) => {
  const events = [];
  mockBackend(t, async (url, init) => {
    assert.match(url, /\/record_ai_preset_test_visitor_event$/);
    events.push(JSON.parse(init.body));
    return Response.json(true);
  });
  for (const event of ['exposure', 'click']) {
    const response = await onRequest({ request: request('?consent=accepted', { method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event }) }, 'DE') });
    assert.equal(response.status, 200);
  }
  assert.deepEqual(events, ['exposure', 'click'].map(event => ({ p_assignment_id: assignment.assignment_id, p_visitor_id: visitorId, p_event: event })));
});

test('events cannot be submitted with only a copied assignment ID', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const cookie of ['', 'preset_test_visitor=invalid']) {
    const response = await onRequest({ request: request('', { method: 'POST', headers: { cookie }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click' }) }) });
    assert.equal(response.status, 403);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('oversized chunked event bodies stop reading at the byte limit', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  let reads = 0, cancelled = false;
  const body = new ReadableStream({
    pull(controller) { reads++; controller.enqueue(new Uint8Array(1024)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const response = await onRequest({ request: request('', { method: 'POST', body, duplex: 'half' }) });
  assert.equal(response.status, 413);
  assert.equal(reads, 3);
  assert.equal(cancelled, true);
  assert.equal(fetch.mock.callCount(), 0);
});

test('oversized content length is rejected without reading the event body', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  let reads = 0;
  const body = new ReadableStream({ pull() { reads++; } }, { highWaterMark: 0 });
  const response = await onRequest({ request: request('', {
    method: 'POST', headers: { 'content-length': '2049' }, body, duplex: 'half',
  }) });
  assert.equal(response.status, 413);
  assert.equal(reads, 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test('event limit counts UTF-8 bytes and accepts exactly 2048 bytes across chunks', async (t) => {
  const backend = mockBackend(t, async () => Response.json(true));
  const event = JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click', padding: 'é' });
  const bytes = new TextEncoder().encode(event.padEnd(2048 - 1));
  assert.equal(bytes.byteLength, 2048);
  let offset = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (offset === bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.slice(offset, ++offset));
    },
  });
  const response = await onRequest({ request: request('', {
    method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body, duplex: 'half',
  }) });
  assert.equal(response.status, 200);
  assert.equal(backend.mock.callCount(), 2);
  const oversized = await onRequest({ request: request('', { method: 'POST', body: 'é'.repeat(1025) }) });
  assert.equal(oversized.status, 413);
  assert.equal(backend.mock.callCount(), 2);
});

test('a cookie belonging to a different visitor cannot record an event', async (t) => {
  mockBackend(t, async () => Response.json(false));
  const response = await onRequest({ request: request('', { method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click' }) }) });
  assert.equal(response.status, 403);
});

test('rate-limited requests never assign a visitor or write an event', async (t) => {
  const subjects = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.match(url, /\/(consume_global_rate_limit|assign_ai_preset_tests_rate_limited)$/);
    subjects.push(JSON.parse(init.body).p_subject);
    return Response.json({ allowed: false, retry_after_seconds: 17 });
  });
  for (const req of [request(), request(`?presetIds=${presetId}`), request('', { method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click' }) })]) {
    const response = await onRequest({ request: req });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '17');
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('x-preset-test-resolved'), null);
  }
  assert.equal(subjects.length, 3);
  assert.equal(subjects[0], subjects[1], 'single and batch lookups share an IP budget');
  assert.equal(subjects[0], subjects[2], 'GET and POST share an IP budget regardless of cookie');
  assert.doesNotMatch(subjects[0], /192\.0\.2\.1/);
});

test('missing server credentials or trusted IP fail closed without anonymous fallback', async (t) => {
  t.mock.method(console, 'error', () => {});
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const noIp = request();
  noIp.headers.delete('cf-connecting-ip');
  for (const context of [{ request: request(), env: { NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key' } }, { request: noIp }]) {
    assert.equal((await onRequest(context)).status, 503);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('an invalid rate-limit response fails closed before experiment writes', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.match(url, /\/assign_ai_preset_tests_rate_limited$/);
    return Response.json(null);
  });
  assert.equal((await onRequest({ request: request() })).status, 503);
});

test('malformed requests and cross-origin mutations are rejected before network access', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const [req, status] of [
    [request('?presetId=wrong'), 400],
    [request('', { method: 'PATCH' }), 405],
    [request('', { method: 'DELETE', headers: { origin: 'https://other.example' } }), 403],
    [request('', { method: 'POST', body: '{' }), 400],
    [request('', { method: 'POST', body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'purchase' }) }), 400],
    [request('', { method: 'POST', body: 'x'.repeat(2049) }), 413],
  ]) assert.equal((await onRequest({ request: req })).status, status);
  assert.equal(fetch.mock.callCount(), 0);
});

test('backend failure is non-cacheable and does not expose internal errors', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('private details', { status: 500 }));
  const response = await onRequest({ request: request() });
  assert.equal(response.status, 503);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.doesNotMatch(await response.text(), /private details/);
});

test('preset pages use middleware while SEO identity stays in the static page', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.ok(routes.include.includes('/preset-test'));
  assert.ok(routes.include.includes('/preset-test/'));
  assert.ok(routes.include.includes('/presets/*'));
  assert.ok(routes.include.includes('/*/presets/*'));
  assert.ok(!routes.include.includes('/*'));
  const page = await readFile(new URL('../src/components/presets/AiPresetPage.tsx', import.meta.url), 'utf8');
  assert.equal(page.match(/<PresetExperimentLink\b/g)?.length, 3);
  assert.match(page, /<PresetExperimentImage\b/);
  assert.equal(page.match(/<PresetExperimentPrice\b/g)?.length, 2);
  assert.match(page, /<noscript>\s*<style>/);
  assert.match(page, /data-preset-test-id=\{preset.id\}/);
});

test('a preset page gets a first-paint preview in one backend call without changing canonical metadata', async (t) => {
  const { onRequest: middleware } = await import('../functions/_middleware.js');
  const backend = mockBackend(t, async (url, init) => {
    assert.match(url, /\/assign_ai_preset_tests_rate_limited$/);
    assert.deepEqual(JSON.parse(init.body).p_preset_ids, [presetId]);
    return Response.json({ [presetId]: assignment });
  });
  const html = `<html><head><link rel="canonical" href="https://example.com/presets/example/"></head><body><div data-preset-test-id="${presetId}"><svg class="preset-experiment-image-placeholder"></svg></div></body></html>`;
  const response = await middleware({
    request: request('', { headers: { cookie: `preset_test_visitor=${visitorId}` } }, 'US'), env,
    next: async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
  });
  const result = await response.text();
  assert.match(result, /preset-test-preview-style/);
  assert.match(result, /preset-test-bootstrap/);
  assert.match(result, /background-image:url\("https:\/\/example.com\/b.jpg"\)/);
  assert.match(result, /rel="canonical" href="https:\/\/example.com\/presets\/example\/"/);
  assert.match(response.headers.get('set-cookie'), /preset_test_visitor=/);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.equal(backend.mock.callCount(), 1);
});

test('EEA preset pages without consent remain unchanged', async (t) => {
  const { onRequest: middleware } = await import('../functions/_middleware.js');
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const html = `<html><head></head><body data-preset-test-id="${presetId}"></body></html>`;
  const response = await middleware({
    request: request('', {}, 'DE'), env,
    next: async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
  });
  assert.equal(await response.text(), html);
  assert.equal(fetch.mock.callCount(), 0);
});

test('accepted consent allows the edge to assign an EEA visitor', async (t) => {
  const { onRequest: middleware } = await import('../functions/_middleware.js');
  mockBackend(t, async (url) => {
    assert.match(url, /\/assign_ai_preset_tests_rate_limited$/);
    return Response.json({ [presetId]: assignment });
  });
  const html = `<html><head></head><body data-preset-test-id="${presetId}"></body></html>`;
  const response = await middleware({
    request: request('', { headers: { cookie: 'preset_test_consent=accepted' } }, 'DE'), env,
    next: async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
  });
  assert.match(await response.text(), /preset-test-bootstrap/);
  assert.match(response.headers.get('set-cookie'), /preset_test_visitor=/);
});

test('the edge does not assign a first request that might belong to a legacy opt-out', async (t) => {
  const { onRequest: middleware } = await import('../functions/_middleware.js');
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const html = `<html><head></head><body data-preset-test-id="${presetId}"></body></html>`;
  const response = await middleware({
    request: request('', {}, 'US'), env,
    next: async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
  });
  assert.equal(await response.text(), html);
  assert.equal(fetch.mock.callCount(), 0);
});

async function loadClientModule(react = React) {
  const source = await readFile(new URL('../src/components/presets/PresetExperiment.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  const require = createRequire(import.meta.url);
  const compiled = { exports: {} };
  const assignments = { exports: {} };
  const assignmentSource = await readFile(new URL('../src/lib/preset-assignments.ts', import.meta.url), 'utf8');
  new Function('module', 'exports', ts.transpileModule(assignmentSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(assignments, assignments.exports);
  const pricing = { exports: {} };
  const pricingSource = await readFile(new URL('../src/lib/pricing.ts', import.meta.url), 'utf8');
  new Function('module', 'exports', ts.transpileModule(pricingSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(pricing, pricing.exports);
  const image = ({ src, alt, width, height, className }) => React.createElement('img', { src, alt, width, height, className });
  new Function('require', 'module', 'exports', outputText)((name) => name === 'next/image' ? { default: image } : name === 'react' ? react : name === '@/lib/pricing' ? pricing.exports : name === '@/lib/preset-assignments' ? assignments.exports : require(name), compiled, compiled.exports);
  return { ...compiled.exports, ...assignments.exports };
}

test('unavailable consent storage never silently opts visitors into experiments', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  });
  const { readPresetExperimentConsent } = await loadClientModule();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  assert.equal(readPresetExperimentConsent(), 'rejected');
  for (const choice of [null, 'accepted', 'rejected']) {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => choice } });
    assert.equal(readPresetExperimentConsent(), choice || '');
  }
});

test('client reads the edge preview from template content', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById: () => ({ content: { textContent: JSON.stringify({ [presetId]: assignment }) } }),
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  const { readPresetAssignment } = await loadClientModule();
  assert.deepEqual(readPresetAssignment(presetId), assignment);
});

test('static rendering retains the original image, alt text and canonical app link', async () => {
  const { PresetExperimentProvider, PresetExperimentLink, PresetExperimentImage, PresetExperimentPrice } = await loadClientModule();
  const markup = renderToStaticMarkup(React.createElement(PresetExperimentProvider, {
    presetId, appUrl: 'https://app.example/#preset/portrait', image: 'https://example.com/main.jpg', alt: 'Original preview', credits: 9, locale: 'en',
  }, React.createElement(PresetExperimentLink, {}, React.createElement(PresetExperimentImage, { width: 960, height: 720 }), React.createElement(PresetExperimentPrice))));
  assert.match(markup, /href="https:\/\/app.example\/#preset\/portrait"/);
  assert.match(markup, /src="https:\/\/example.com\/main.jpg"/);
  assert.match(markup, /alt="Original preview"/);
  assert.match(markup, /preset-experiment-image-placeholder/);
  assert.match(markup, /preset-experiment-image invisible/);
  assert.match(markup, /preset-experiment-price inline-flex gap-2 invisible/);
  assert.match(markup, /9 CR/);
  assert.doesNotMatch(markup, /~[a-f\d-]{36}/);
});

// Exercise the provider's effects without a browser or an additional DOM dependency.
async function clientHarness(t) {
  const states = [], effects = [], scheduled = [];
  let stateIndex = 0, effectIndex = 0, context, imageKey, imageStateIndex;
  const client = await loadClientModule({
    ...React,
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect(callback, deps) {
      const index = effectIndex++;
      if (!effects[index] || deps.some((value, i) => value !== effects[index].deps[i])) {
        scheduled.push(() => {
          effects[index]?.cleanup?.();
          effects[index] = { deps, cleanup: callback() };
        });
      }
    },
    useContext: () => context,
  });
  const timers = new Map();
  let timerId = 0, choice = 'accepted';
  const window = Object.assign(new EventTarget(), {
    Image: class { constructor() { throw new Error('Image decoding must not gate assignment'); } },
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
  });
  t.after(() => { for (const effect of effects) effect.cleanup?.(); });
  for (const [name, value] of Object.entries({ window, localStorage: { getItem: () => choice } })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }
  return {
    resolveAssignments: client.resolvePresetAssignments,
    readAssignment: client.readPresetAssignment,
    clearAssignments: client.clearPresetAssignments,
    dispose: () => { for (const effect of effects) effect.cleanup?.(); },
    render() {
      stateIndex = effectIndex = 0;
      context = client.PresetExperimentProvider({ presetId, appUrl: 'https://app.example/#preset/portrait', image: 'https://example.com/main.jpg', alt: 'Main preview', credits: 9, locale: 'en', children: null }).props.value;
      while (scheduled.length) scheduled.shift()();
      return context;
    },
    image() {
      const element = client.PresetExperimentImage({ width: 960, height: 720 });
      if (imageKey !== element.key) {
        imageKey = element.key;
        imageStateIndex = states.length;
      }
      stateIndex = imageStateIndex;
      return element.type(element.props);
    },
    link: () => client.PresetExperimentLink({ children: 'Open app' }),
    price: () => renderToStaticMarkup(client.PresetExperimentPrice()),
    expire: () => { for (const callback of timers.values()) callback(); },
    consent(value) { choice = value; window.dispatchEvent(new Event('consent-choice-changed')); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('cached previews and confirmed no-test results bypass an unrelated pending request', async (t) => {
  let finish;
  const cachedEmptyId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const fetch = t.mock.method(globalThis, 'fetch', (url) => {
    if (url.includes('presetIds=')) return Promise.resolve(Response.json({ [presetId]: assignment }));
    return new Promise(resolve => { finish = resolve; });
  });
  const client = await clientHarness(t);
  await client.resolveAssignments([presetId, cachedEmptyId]);
  const pending = client.resolveAssignments([visitorId]);
  let cachedResolved = false;
  const cached = client.resolveAssignments([presetId, cachedEmptyId]).then(() => { cachedResolved = true; });
  await settle();
  assert.equal(cachedResolved, true, 'cached results must not wait for another network response');
  assert.equal(fetch.mock.callCount(), 2);
  finish(Response.json(assignment));
  await Promise.all([pending, cached]);
});

test('confirmed no-test responses are reused until assignments are cleared', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(null, {
    headers: { 'x-preset-test-resolved': '1' },
  }));
  const client = await clientHarness(t);
  await client.resolveAssignments([presetId]);
  await client.resolveAssignments([presetId]);
  assert.equal(fetch.mock.callCount(), 1);
  client.clearAssignments();
  await client.resolveAssignments([presetId]);
  assert.equal(fetch.mock.callCount(), 2);
});

test('unresolved consent and legacy null responses remain retryable', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(null));
  const client = await clientHarness(t);
  client.consent('');
  await client.resolveAssignments([presetId]);
  client.consent('accepted');
  await client.resolveAssignments([presetId]);
  await client.resolveAssignments([presetId]);
  assert.equal(fetch.mock.callCount(), 3);
});

test('failed assignment lookups are not cached as no test', async (t) => {
  let fail = true;
  const fetch = t.mock.method(globalThis, 'fetch', async () => fail
    ? new Response(null, { status: 503 }) : Response.json(assignment));
  const client = await clientHarness(t);
  await assert.rejects(client.resolveAssignments([presetId]), /HTTP 503/);
  fail = false;
  await client.resolveAssignments([presetId]);
  assert.deepEqual(client.readAssignment(presetId), assignment);
  assert.equal(fetch.mock.callCount(), 2);
});

test('simultaneous no-test lookups reuse the confirmed negative result', async (t) => {
  let finish;
  const fetch = t.mock.method(globalThis, 'fetch', () => new Promise(resolve => { finish = resolve; }));
  const client = await clientHarness(t);
  const first = client.resolveAssignments([presetId]);
  const second = client.resolveAssignments([presetId]);
  finish(Response.json(null, { headers: { 'x-preset-test-resolved': '1' } }));
  await Promise.all([first, second]);
  assert.equal(fetch.mock.callCount(), 1);
});

test('a delayed no-test response cannot overwrite a fresh assignment after consent changes', async (t) => {
  const requests = [];
  const fetch = t.mock.method(globalThis, 'fetch', (_url, init) => new Promise(resolve => {
    requests.push({ resolve, signal: init.signal });
  }));
  const client = await clientHarness(t);
  const oldRequest = client.resolveAssignments([presetId]);
  client.consent('rejected');
  client.clearAssignments();
  assert.equal(requests[0].signal.aborted, true);

  client.consent('accepted');
  const newRequest = client.resolveAssignments([presetId]);
  requests[1].resolve(Response.json(assignment));
  await newRequest;
  requests[0].resolve(Response.json(null, { headers: { 'x-preset-test-resolved': '1' } }));
  await oldRequest;
  await client.resolveAssignments([presetId]);
  assert.deepEqual(client.readAssignment(presetId), assignment);
  assert.equal(fetch.mock.callCount(), 2);
});

test('grid and detail share a pending assignment request across navigation', async (t) => {
  let finish, signal;
  const calls = [];
  t.mock.method(globalThis, 'fetch', (url, init) => {
    if (init.method === 'POST') return Promise.resolve(Response.json({ ok: true }));
    calls.push(url);
    signal = init.signal;
    return new Promise(resolve => { finish = resolve; });
  });
  const client = await clientHarness(t);
  const batch = client.resolveAssignments([presetId, visitorId]);
  client.render();
  assert.equal(calls.length, 1);
  finish(Response.json({ [presetId]: assignment }));
  await batch;
  await settle();
  assert.equal(calls.length, 1);
  assert.equal(client.render().image, assignment.featured_graphics);
  assert.match(client.render().appUrl, new RegExp(`~${assignment.assignment_id}$`));
  assert.equal(signal.aborted, false);
});

test('different preset requests wait for the first response to establish the visitor cookie', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', (url, init) => new Promise(resolve => { requests.push({ url, signal: init.signal, resolve }); }));
  const client = await clientHarness(t);
  const first = client.resolveAssignments([presetId]);
  const second = client.resolveAssignments([visitorId]);
  assert.equal(requests.length, 1);
  requests[0].resolve(Response.json(assignment));
  await first;
  await settle();
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, new RegExp(visitorId));
  requests[1].resolve(Response.json(assignment));
  await second;
});

test('unmounting the detail page does not abort assignment needed by the grid', async (t) => {
  let finish, signal;
  const fetch = t.mock.method(globalThis, 'fetch', (_url, init) => {
    signal = init.signal;
    return new Promise(resolve => { finish = resolve; });
  });
  const client = await clientHarness(t);
  client.render();
  const grid = client.resolveAssignments([presetId]);
  client.dispose();
  assert.equal(signal.aborted, false);
  finish(Response.json(assignment));
  await grid;
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(client.readAssignment(presetId), assignment);
});

test('assignment and app links activate without waiting for image loading', async (t) => {
  let resolveAssignment;
  const events = [];
  t.mock.method(globalThis, 'fetch', (url, init) => {
    if (init.method === 'POST') {
      events.push(JSON.parse(init.body));
      return Promise.resolve(Response.json({ ok: true }));
    }
    return new Promise(resolve => { resolveAssignment = resolve; });
  });
  const client = await clientHarness(t);
  assert.equal(client.render().pending, false, 'initial static fallback remains usable without JavaScript');
  assert.equal(client.render().resolved, false, 'the original preview remains covered until assignment resolves');
  const initialImage = client.image().props.children[1];
  assert.match(initialImage.props.className, /invisible/);
  initialImage.props.onLoad({});
  assert.equal(client.render().pending, true);
  const pendingLink = client.link();
  assert.equal(pendingLink.props.href, undefined, 'a pending assignment cannot open the unassigned app URL');
  assert.equal(pendingLink.props['aria-busy'], true);
  let prevented = 0;
  for (const handler of [pendingLink.props.onClick, pendingLink.props.onAuxClick]) handler({ preventDefault: () => prevented++, button: 1 });
  assert.equal(prevented, 2);
  resolveAssignment(Response.json(assignment));
  await settle();
  const context = client.render();
  assert.equal(context.pending, false);
  assert.equal(context.resolved, true);
  assert.equal(context.image, assignment.featured_graphics);
  assert.equal(context.alt, assignment.featured_graphics_alt);
  assert.equal(context.credits, 19);
  const loadingImage = client.image().props.children[1];
  assert.equal(loadingImage.props.src, assignment.featured_graphics);
  assert.match(loadingImage.props.className, /invisible/, 'a loaded main image cannot appear while B loads');
  loadingImage.props.onLoad({});
  assert.doesNotMatch(client.image().props.children[1].props.className, /invisible/);
  initialImage.props.onLoad({});
  assert.doesNotMatch(client.image().props.children[1].props.className, /invisible/, 'a late A load cannot hide B');
  assert.match(client.price(), /19 CR/);
  const link = client.link();
  assert.equal(link.props.href, `https://app.example/#preset/portrait~${assignment.assignment_id}`);
  link.props.onClick({ defaultPrevented: false });
  link.props.onAuxClick({ button: 1, defaultPrevented: false });
  assert.deepEqual(events, ['exposure', 'click', 'click'].map(event => ({ assignmentId: assignment.assignment_id, event })));
});

test('no experiment, backend failure and timeouts restore usable canonical links', async (t) => {
  for (const scenario of ['none', 'failure', 'timeout']) await t.test(scenario, async (t) => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(globalThis, 'fetch', async (_url, init) => {
      if (scenario === 'none') return Response.json(null);
      if (scenario === 'failure') return new Response(null, { status: 503 });
      return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }));
    });
    const client = await clientHarness(t);
    client.render();
    assert.equal(client.render().pending, true);
    if (scenario === 'timeout') client.expire();
    await settle();
    assert.equal(client.render().pending, false);
    assert.equal(client.render().resolved, true);
    assert.match(client.price(), /9 CR/);
    assert.equal(client.link().props.href, 'https://app.example/#preset/portrait');
  });
});

test('consent withdrawal cancels pending assignment and ignores its delayed response', async (t) => {
  let resolveAssignment;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'DELETE') return Response.json(null);
    return new Promise(resolve => { resolveAssignment = resolve; });
  });
  const client = await clientHarness(t);
  client.render();
  client.consent('rejected');
  assert.equal(client.render().pending, false);
  resolveAssignment(Response.json(assignment));
  await settle();
  assert.equal(client.render().image, 'https://example.com/main.jpg');
  assert.match(client.price(), /9 CR/);
  assert.equal(client.link().props.href, 'https://app.example/#preset/portrait');
});

test('legacy assignment responses keep the canonical price', async (t) => {
  const legacyAssignment = { ...assignment };
  delete legacyAssignment.cost_credits;
  t.mock.method(globalThis, 'fetch', async (_url, init) => Response.json(init.method === 'POST' ? { ok: true } : legacyAssignment));
  const client = await clientHarness(t);
  client.render();
  await settle();
  const context = client.render();
  assert.equal(context.credits, 9);
  assert.equal(context.image, assignment.featured_graphics);
  assert.match(client.price(), /9 CR/);
});

test('invalid experiment prices do not activate a mismatched app link', async (t) => {
  for (const price of [0, -1, 1.5, '19', null]) await t.test(String(price), async (t) => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(globalThis, 'fetch', async () => Response.json({ ...assignment, cost_credits: price }));
    const client = await clientHarness(t);
    client.render();
    await settle();
    assert.equal(client.render().credits, 9);
    assert.equal(client.link().props.href, 'https://app.example/#preset/portrait');
  });
});
