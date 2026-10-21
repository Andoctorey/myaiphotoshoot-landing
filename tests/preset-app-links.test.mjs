import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/app-links.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = vm.createContext({ exports: {}, URL });
vm.runInContext(compiled, context);
const links = context.exports;
const assignment = '12345678-1234-4123-8123-123456789abc';

test('first-paint Safari banner uses the same assigned preset and strips unrelated query data', async () => {
  const { assignedPresetBanner } = await import('../functions/_middleware.js');
  const html = '<head><meta name="apple-itunes-app" content="app-id=6744860178, app-argument=https://myaiphotoshoot.com/"><link rel="canonical" href="/ja/presets/anime/"></head>';
  const result = assignedPresetBanner(html, 'https://myaiphotoshoot.com/ja/presets/anime/?gclid=CaseSensitive&email=private', {
    assignment_id: assignment, featured_graphics: 'https://example.com/preview.jpg',
  });
  assert.ok(result.includes(`app-argument=https://myaiphotoshoot.com/ja/presets/anime/?assignment_id=${assignment}&amp;gclid=CaseSensitive`));
  assert.ok(result.includes('rel="canonical" href="/ja/presets/anime/"'));
  assert.equal(result.includes('private'), false);
  assert.equal(assignedPresetBanner(html, 'https://myaiphotoshoot.com/presets/anime/', null), html);
  assert.equal(assignedPresetBanner(html, 'https://myaiphotoshoot.com/presets/', { assignment_id: assignment, featured_graphics: 'https://example.com/preview.jpg' }), html);
});

test('native and banner links preserve the assigned preset without changing the web destination', () => {
  const web = `https://app.myaiphotoshoot.com/#preset/anime~${assignment}`;
  assert.equal(links.buildPresetNativeAppUrl(web, 'ja'), `https://app.myaiphotoshoot.com/open/preset/anime~${assignment}/?locale=ja`);
  assert.equal(links.buildPresetMarketingUrl(web, 'ja'), `https://myaiphotoshoot.com/ja/presets/anime/?assignment_id=${assignment}`);
  assert.equal(links.buildPresetMarketingUrl('https://app.myaiphotoshoot.com/#preset/anime', 'en'), 'https://myaiphotoshoot.com/presets/anime/');
  assert.equal(links.presetSmartAppBanner('https://myaiphotoshoot.com/presets/anime/'), 'app-id=6744860178, app-argument=https://myaiphotoshoot.com/presets/anime/');
});

test('only actual preset links can become app-opening links', () => {
  for (const value of [
    'https://example.com/#preset/anime',
    'https://app.myaiphotoshoot.com/#ideas',
    'https://app.myaiphotoshoot.com/#preset/anime%2Fother',
    'https://app.myaiphotoshoot.com/#preset/anime~invalid',
  ]) assert.throws(() => links.buildPresetNativeAppUrl(value, 'en'));
});

test('mobile detection supports iPad desktop user agents and leaves desktop on web', () => {
  assert.equal(links.mobileAppPlatform('Mozilla iPhone Safari', 1), 'ios');
  assert.equal(links.mobileAppPlatform('Mozilla Macintosh Safari', 5), 'ios');
  assert.equal(links.mobileAppPlatform('Mozilla Macintosh Safari', 0), null);
  assert.equal(links.mobileAppPlatform('Mozilla Android Chrome', 1), 'android');
});

test('every landing locale includes the secondary action', async () => {
  for (const locale of ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar']) {
    const messages = JSON.parse(await readFile(new URL(`../messages/${locale}/index.json`, import.meta.url), 'utf8'));
    assert.equal(typeof messages.presets.openInApp, 'string', locale);
    assert.ok(messages.presets.openInApp.trim(), locale);
  }
});

test('secondary action waits for the current assignment and never reuses a stale native link', async () => {
  const require = createRequire(import.meta.url);
  const source = await readFile(new URL('../src/components/presets/PresetAppLinks.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const states = [], effects = [], scheduled = [];
  let stateIndex = 0, effectIndex = 0, clicked = 0;
  const meta = { content: 'original preset banner' };
  const events = [];
  const window = new EventTarget();
  window.gtag = (...event) => events.push(event);
  let handoff = '';
  let preset = { appUrl: 'https://app.myaiphotoshoot.com/#preset/anime', locale: 'en', resolved: false, pending: false, trackClick: () => clicked++ };
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect(callback, deps) {
      const index = effectIndex++;
      if (!effects[index] || deps.some((value, i) => value !== effects[index].deps[i])) scheduled.push(() => {
        effects[index]?.cleanup?.();
        effects[index] = { deps, cleanup: callback() };
      });
    },
  };
  const module = { exports: {} };
  const dependencies = {
    react,
    '@/lib/analytics': { withCurrentAttribution: url => handoff ? `${url}&ga_handoff=${handoff}` : url },
    '@/lib/landing-handoff': { LANDING_HANDOFF_UPDATED: 'landing-handoff-updated' },
    '@/lib/app-links': links,
    './PresetExperiment': { usePresetExperiment: () => preset },
  };
  const run = new Function('module', 'exports', 'require', 'navigator', 'document', 'window', 'console', compiled);
  run(module, module.exports, name => dependencies[name] ?? require(name),
    { userAgent: 'iPhone', maxTouchPoints: 1 }, { querySelector: () => meta },
    window, { info() {} });
  const render = () => {
    stateIndex = effectIndex = 0;
    return module.exports.default({ presetId: 'preset-id', label: 'Open in app' });
  };
  const flush = () => { while (scheduled.length) scheduled.shift()(); };
  assert.equal(render(), null);
  flush();
  assert.equal(render().props.href, undefined);
  preset = { ...preset, resolved: true, appUrl: `https://app.myaiphotoshoot.com/#preset/anime~${assignment}` };
  render(); flush();
  const ready = render();
  assert.equal(ready.props.href, `https://app.myaiphotoshoot.com/open/preset/anime~${assignment}/?locale=en`);
  assert.ok(meta.content.includes(`assignment_id=${assignment}`));
  ready.props.onClick({ preventDefault() { assert.fail('resolved tap should navigate'); } });
  assert.equal(clicked, 1);
  assert.equal(events[0][1], 'preset_app_open_click');
  handoff = 'consented-handoff';
  window.dispatchEvent(new Event('landing-handoff-updated'));
  assert.ok(render().props.href.endsWith('&ga_handoff=consented-handoff'));
  assert.ok(meta.content.includes('ga_handoff=consented-handoff'));
  handoff = '';
  window.dispatchEvent(new Event('consent-choice-changed'));
  assert.equal(render().props.href.includes('ga_handoff'), false);
  preset = { ...preset, appUrl: 'https://app.myaiphotoshoot.com/#preset/anime' };
  assert.equal(render().props.href, undefined);
  flush();
  assert.equal(render().props.href, 'https://app.myaiphotoshoot.com/open/preset/anime/?locale=en');
  for (const effect of effects) effect.cleanup?.();
});
