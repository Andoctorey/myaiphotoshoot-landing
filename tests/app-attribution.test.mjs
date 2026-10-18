import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText;

function landing(search = '') {
  const storage = new Map();
  const window = {
    location: {search, origin: 'https://myaiphotoshoot.com'},
    sessionStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
  };
  const context = vm.createContext({window, exports: {}, URL, URLSearchParams});
  vm.runInContext(compiled, context);
  return {window, ...context.exports};
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
