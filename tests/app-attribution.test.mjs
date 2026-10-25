import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText;
const handoffSource = await readFile(new URL('../src/lib/landing-handoff.ts', import.meta.url), 'utf8');
const handoffCompiled = ts.transpileModule(handoffSource, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText;
const appLinksSource = await readFile(new URL('../src/lib/app-links.ts', import.meta.url), 'utf8');
const appLinks = vm.createContext({ exports: {}, URL, URLSearchParams });
vm.runInContext(ts.transpileModule(appLinksSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, appLinks);

function landing(search = '', consent = 'rejected') {
  const storage = new Map();
  const window = Object.assign(new EventTarget(), {
    location: {search, origin: 'https://myaiphotoshoot.com', pathname: '/presets/anime/'},
    localStorage: {getItem: () => consent},
    sessionStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
  });
  const handoffContext = vm.createContext({window, exports: {}, URL, URLSearchParams, setTimeout, clearTimeout, Event});
  vm.runInContext(handoffCompiled, handoffContext);
  const context = vm.createContext({window, exports: {}, URL, URLSearchParams,
    require: name => name === './app-links' ? appLinks.exports : handoffContext.exports});
  vm.runInContext(compiled, context);
  return {window, ...context.exports, ...handoffContext.exports};
}

test('Google Ads landing click survives navigation into the Android install referrer', () => {
  const app = landing('?gclid=google-click&utm_source=google&utm_medium=cpc&utm_campaign=anime&email=private');
  app.captureCurrentAttribution();
  app.window.location.search = '';
  const url = new URL(app.withCurrentAttribution('https://play.google.com/store/apps/details?id=com.myaiphotoshoot'));
  const referrer = new URLSearchParams(url.searchParams.get('referrer'));
  assert.equal(referrer.get('gclid'), 'google-click');
  assert.equal(referrer.get('utm_campaign'), 'anime');
  assert.equal(referrer.get('utm_medium'), 'cpc');
  assert.equal(url.searchParams.get('id'), 'com.myaiphotoshoot');
  assert.equal(url.toString().includes('private'), false);
});

test('preset assignments and mask genders survive repeated attribution without copying unrelated referrer data', () => {
  const app = landing(`?gclid=click&utm_campaign=${'x'.repeat(800)}`);
  const assignment = '12345678-1234-4123-8123-123456789abc';
  const mask = '87654321-4321-4321-8321-cba987654321';
  for (const destination of [
    appLinks.exports.buildPresetGooglePlayUrl(`https://app.myaiphotoshoot.com/#preset/anime~${assignment}`),
    appLinks.exports.buildMaskGooglePlayUrl(mask, 'male'),
  ]) {
    const input = new URL(destination);
    const expected = new URLSearchParams(input.searchParams.get('referrer'));
    const referrer = new URLSearchParams(expected);
    referrer.set('email', 'private');
    referrer.set('ga_handoff', 'stale-identity');
    input.searchParams.set('referrer', referrer.toString());
    const once = app.withCurrentAttribution(input.href);
    const twice = app.withCurrentAttribution(once);
    const actual = new URLSearchParams(new URL(twice).searchParams.get('referrer'));
    for (const [key, value] of expected) assert.equal(actual.get(key), value);
    assert.equal(actual.get('gclid'), 'click');
    assert.equal(actual.has('utm_campaign'), false);
    assert.equal(actual.has('email'), false);
    assert.equal(actual.has('ga_handoff'), false);
    assert.ok(actual.toString().length <= 512);
    assert.equal(twice, once);
  }
});

test('ambiguous, malformed and foreign install selections are dropped while attribution remains usable', () => {
  const app = landing('?gclid=click');
  const mask = '87654321-4321-4321-8321-cba987654321';
  for (const value of [
    'preset=anime&preset=other', 'preset=anime~invalid', 'preset=anime%2Fother',
    `preset=anime&mask=${mask}`, `mask=${mask}&gender=other`, `mask=${mask}&gender=male&gender=female`,
    'mask=all&gender=male', 'mask=not-a-mask', `preset=anime&gender=male`,
  ]) {
    const input = new URL('https://play.google.com/store/apps/details?id=com.myaiphotoshoot');
    input.searchParams.set('referrer', value);
    const referrer = new URLSearchParams(new URL(app.withCurrentAttribution(input.href)).searchParams.get('referrer'));
    assert.equal(referrer.has('preset'), false, value);
    assert.equal(referrer.has('mask'), false, value);
    assert.equal(referrer.has('gender'), false, value);
    assert.equal(referrer.get('gclid'), 'click');
  }
  for (const input of [
    'https://play.google.com/store/apps/details?id=other.app&referrer=preset%3Danime',
    'http://play.google.com/store/apps/details?id=com.myaiphotoshoot&referrer=preset%3Danime',
    'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&referrer=preset%3Danime&referrer=preset%3Dother',
  ]) {
    const referrer = new URLSearchParams(new URL(app.withCurrentAttribution(input)).searchParams.get('referrer'));
    assert.equal(referrer.has('preset'), false, input);
  }
});

test('consented browser identity survives native links and Play installation without leaking to the App Store', async () => {
  const app = landing('?gclid=click&utm_campaign=anime', 'accepted');
  app.window.gtag = (_command, _id, field, callback) => callback(field === 'client_id' ? '12345678.87654321' : Math.floor(Date.now() / 1000));
  await app.prepareLandingHandoff('G-test');
  const native = new URL(app.withCurrentAttribution('https://app.myaiphotoshoot.com/open/preset/anime/'));
  assert.match(native.searchParams.get('ga_handoff'), /^1~12345678\.87654321~/);
  assert.equal(native.searchParams.get('landing_path'), '/presets/anime/');
  const selectedPreset = 'anime~12345678-1234-4123-8123-123456789abc';
  const play = new URL(app.withCurrentAttribution(appLinks.exports.buildPresetGooglePlayUrl(`https://app.myaiphotoshoot.com/#preset/${selectedPreset}`)));
  const selectedReferrer = new URLSearchParams(play.searchParams.get('referrer'));
  assert.equal(selectedReferrer.get('ga_handoff'), native.searchParams.get('ga_handoff'));
  assert.equal(selectedReferrer.get('preset'), selectedPreset);
  assert.equal(new URL(app.withCurrentAttribution('https://apps.apple.com/app/id6744860178')).searchParams.has('ga_handoff'), false);
  app.window.localStorage.getItem = () => 'rejected';
  const revoked = new URLSearchParams(new URL(app.withCurrentAttribution(play.href)).searchParams.get('referrer'));
  assert.equal(revoked.has('ga_handoff'), false);
  assert.equal(revoked.get('preset'), selectedPreset);
});

test('denied consent never reads or forwards the browser identity', async () => {
  const app = landing('?utm_source=google');
  app.window.gtag = () => { throw new Error('Analytics identity must not be read'); };
  await app.prepareLandingHandoff('G-test');
  assert.equal(new URL(app.withCurrentAttribution('https://app.myaiphotoshoot.com/open/preset/anime/')).searchParams.has('ga_handoff'), false);
});

test('handoff has priority over optional campaign tags and stays on trusted HTTPS destinations', async () => {
  const app = landing(`?gclid=click&utm_campaign=${'x'.repeat(400)}`, 'accepted');
  app.window.gtag = (_command, _id, field, callback) => callback(field === 'client_id' ? '12345678.87654321' : Math.floor(Date.now() / 1000));
  await app.prepareLandingHandoff('G-test');
  const play = new URL(app.withCurrentAttribution('https://play.google.com/store/apps/details?id=com.myaiphotoshoot'));
  const referrer = new URLSearchParams(play.searchParams.get('referrer'));
  assert.equal(referrer.get('gclid'), 'click');
  assert.ok(referrer.get('ga_handoff'));
  assert.ok(referrer.toString().length <= 512);
  for (const destination of ['http://app.myaiphotoshoot.com/open/preset/anime/',
    'https://example.com/', 'https://play.google.com/store/apps/details?id=another.app']) {
    assert.equal(app.withCurrentAttribution(destination).includes('ga_handoff'), false);
  }
});

test('visitors keep the original landing page when navigating with or without campaign tags', () => {
  for (const search of ['', '?gclid=click&utm_source=google&utm_campaign=anime']) {
    const app = landing(search);
    app.captureCurrentAttribution();
    app.window.location.pathname = '/presets/another/';
    const native = new URL(app.withCurrentAttribution('https://app.myaiphotoshoot.com/open/preset/anime/'));
    assert.equal(native.searchParams.get('landing_path'), '/presets/anime/');
  }
});

test('a new ad click replaces the previous landing attribution', () => {
  const app = landing('?gclid=first&utm_campaign=anime');
  app.captureCurrentAttribution();
  app.window.location.search = '?gclid=second&utm_campaign=anime';
  app.window.location.pathname = '/presets/another/';
  const native = new URL(app.withCurrentAttribution('https://app.myaiphotoshoot.com/open/preset/anime/'));
  assert.equal(native.searchParams.get('gclid'), 'second');
  assert.equal(native.searchParams.get('landing_path'), '/presets/another/');
});

test('an unavailable Google tag cannot leave handoff preparation pending indefinitely', async () => {
  const app = landing('', 'accepted');
  app.window.gtag = () => {};
  await app.prepareLandingHandoff('G-test');
  assert.equal(app.readLandingHandoff(), null);
});

test('a slow Google script still prepares the browser identity when it finishes loading', {timeout: 2_000}, async () => {
  const app = landing('', 'accepted');
  const effects = [];
  let script;
  const document = {
    title: 'Anime portraits',
    getElementById: () => script,
    createElement: () => new EventTarget(),
    head: {appendChild: element => { script = element; }},
  };
  const source = await readFile(new URL('../src/components/GoogleAnalytics.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  const dependencies = {
    react: {useEffect: effect => effects.push(effect)},
    'react/jsx-runtime': {jsx: () => null},
    'next/navigation': {},
    '@/lib/analytics': app,
    '@/lib/landing-handoff': app,
  };
  const context = vm.createContext({window: app.window, document, exports: {}, require: name => dependencies[name]});
  vm.runInContext(compiled, context);
  context.exports.default({measurementId: 'G-test'});
  const cleanup = effects[0]();
  try {
    await app.prepareLandingHandoff('G-test');
    assert.equal(app.readLandingHandoff(), null);
    app.window.gtag = (_command, _id, field, callback) => callback(field === 'client_id' ? '12345678.87654321' : Math.floor(Date.now() / 1000));
    const identityReady = new Promise(resolve => app.window.addEventListener(app.LANDING_HANDOFF_UPDATED, resolve, {once: true}));
    script.dispatchEvent(new Event('load'));
    await identityReady;
    const native = new URL(app.withCurrentAttribution('https://app.myaiphotoshoot.com/open/preset/anime/'));
    assert.match(native.searchParams.get('ga_handoff'), /^1~12345678\.87654321~/);
  } finally {
    cleanup();
  }
});

test('consent revocation during identity loading cannot publish a late handoff', async () => {
  const app = landing('', 'accepted');
  const callbacks = [];
  app.window.gtag = (_command, _id, _field, callback) => callbacks.push(callback);
  const pending = app.prepareLandingHandoff('G-test');
  app.window.localStorage.getItem = () => 'rejected';
  callbacks[0]('12345678.87654321');
  callbacks[1](Math.floor(Date.now() / 1000));
  await pending;
  assert.equal(app.readLandingHandoff(), null);
});

test('long optional tags do not erase the click ID needed for purchase attribution', () => {
  const app = landing(`?gclid=google-click&utm_campaign=${'x'.repeat(800)}&utm_source=google`);
  const url = new URL(app.withCurrentAttribution('https://play.google.com/store/apps/details?id=com.myaiphotoshoot'));
  const referrer = new URLSearchParams(url.searchParams.get('referrer'));
  assert.equal(referrer.get('gclid'), 'google-click');
  assert.equal(referrer.get('utm_source'), 'google');
  assert.equal(referrer.has('utm_campaign'), false);
  assert.ok(referrer.toString().length <= 512);
});

test('outbound preset URLs retain Google braid parameters and their destination', () => {
  const app = landing('?gbraid=braid-value&utm_campaign=anime');
  for (const destination of [
    'https://myaiphotoshoot.com/presets/what-anime-character-do-i-look-like/',
    'https://app.myaiphotoshoot.com/#preset/what-anime-character-do-i-look-like',
  ]) {
    const url = new URL(app.withCurrentAttribution(destination));
    assert.equal(url.searchParams.get('gbraid'), 'braid-value');
    assert.equal(url.searchParams.get('utm_campaign'), 'anime');
    assert.equal(url.hash, new URL(destination).hash);
    assert.equal(url.pathname, new URL(destination).pathname);
  }
});
