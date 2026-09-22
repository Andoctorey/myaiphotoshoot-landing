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
const assignment = { assignment_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', featured_graphics: 'https://example.com/b.jpg', featured_graphics_alt: 'Preview B' };

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
  mockBackend(t, async (url, init) => {
    assert.equal(url, 'https://backend.example/rest/v1/rpc/assign_ai_preset_test');
    const body = JSON.parse(init.body);
    assert.equal(body.p_preset_id, presetId);
    visitor = body.p_visitor_id;
    assert.match(visitor, /^[a-f\d-]{36}$/i);
    return Response.json(assignment);
  });
  const response = await onRequest({ request: request() });
  assert.deepEqual(await response.json(), assignment);
  assert.match(response.headers.get('set-cookie'), new RegExp(`preset_test_visitor=${visitor};`));
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
});

test('repeat visits reuse the browser ID across preset experiments', async (t) => {
  mockBackend(t, async (_url, init) => {
    assert.equal(JSON.parse(init.body).p_visitor_id, visitorId);
    return Response.json(assignment);
  });
  const response = await onRequest({ request: request(undefined, { headers: { cookie: `other=1; preset_test_visitor=${visitorId}` } }) });
  assert.equal(response.status, 200);
});

test('no running test leaves the page canonical without setting a tracking cookie', async (t) => {
  mockBackend(t, async () => Response.json(null));
  const response = await onRequest({ request: request() });
  assert.equal(await response.json(), null);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('opt out and unresolved consent clear the cookie without contacting Supabase', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const req of [request('?consent=rejected'), request(undefined, {}, 'DE'), request('', { method: 'DELETE' })]) {
    const response = await onRequest({ request: req });
    assert.equal(await response.json(), null);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
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

test('a cookie belonging to a different visitor cannot record an event', async (t) => {
  mockBackend(t, async () => Response.json(false));
  const response = await onRequest({ request: request('', { method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click' }) }) });
  assert.equal(response.status, 403);
});

test('rate-limited requests never assign a visitor or write an event', async (t) => {
  const subjects = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.match(url, /\/consume_global_rate_limit$/);
    subjects.push(JSON.parse(init.body).p_subject);
    return Response.json({ allowed: false, retry_after_seconds: 17 });
  });
  for (const req of [request(), request('', { method: 'POST', headers: { cookie: `preset_test_visitor=${visitorId}` }, body: JSON.stringify({ assignmentId: assignment.assignment_id, event: 'click' }) })]) {
    const response = await onRequest({ request: req });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '17');
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0], subjects[1], 'GET and POST share an IP budget regardless of cookie');
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
    assert.match(url, /\/consume_global_rate_limit$/);
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

test('only runtime endpoints invoke Pages Functions; canonical preset URLs stay static', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.ok(routes.include.includes('/preset-test'));
  assert.ok(routes.include.includes('/preset-test/'));
  assert.ok(!routes.include.some(path => path.startsWith('/presets') || path === '/*'));
  const page = await readFile(new URL('../src/components/presets/AiPresetPage.tsx', import.meta.url), 'utf8');
  assert.equal(page.match(/<PresetExperimentLink\b/g)?.length, 3);
  assert.match(page, /<PresetExperimentImage\b/);
});

async function loadClientModule(react = React) {
  const source = await readFile(new URL('../src/components/presets/PresetExperiment.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  const require = createRequire(import.meta.url);
  const compiled = { exports: {} };
  const image = ({ src, alt, width, height }) => React.createElement('img', { src, alt, width, height });
  new Function('require', 'module', 'exports', outputText)((name) => name === 'next/image' ? { default: image } : name === 'react' ? react : require(name), compiled, compiled.exports);
  return compiled.exports;
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

test('static rendering retains the original image, alt text and canonical app link', async () => {
  const { PresetExperimentProvider, PresetExperimentLink, PresetExperimentImage } = await loadClientModule();
  const markup = renderToStaticMarkup(React.createElement(PresetExperimentProvider, {
    presetId, appUrl: 'https://app.example/#preset/portrait', image: 'https://example.com/main.jpg', alt: 'Original preview',
  }, React.createElement(PresetExperimentLink, {}, React.createElement(PresetExperimentImage, { width: 960, height: 720 }))));
  assert.match(markup, /href="https:\/\/app.example\/#preset\/portrait"/);
  assert.match(markup, /src="https:\/\/example.com\/main.jpg"/);
  assert.match(markup, /alt="Original preview"/);
  assert.doesNotMatch(markup, /~[a-f\d-]{36}/);
});

// Exercise the provider's effects without a browser or an additional DOM dependency.
async function clientHarness(t) {
  const states = [], effects = [], scheduled = [];
  let stateIndex = 0, effectIndex = 0, context;
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
    render() {
      stateIndex = effectIndex = 0;
      context = client.PresetExperimentProvider({ presetId, appUrl: 'https://app.example/#preset/portrait', image: 'https://example.com/main.jpg', alt: 'Main preview', children: null }).props.value;
      while (scheduled.length) scheduled.shift()();
      return context;
    },
    link: () => client.PresetExperimentLink({ children: 'Open app' }),
    expire: () => { for (const callback of timers.values()) callback(); },
    consent(value) { choice = value; window.dispatchEvent(new Event('consent-choice-changed')); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

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
  assert.equal(context.image, assignment.featured_graphics);
  assert.equal(context.alt, assignment.featured_graphics_alt);
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
  assert.equal(client.link().props.href, 'https://app.example/#preset/portrait');
});
