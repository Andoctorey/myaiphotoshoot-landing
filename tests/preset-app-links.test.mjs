import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/app-links.ts', import.meta.url), { encoding: 'utf8' });
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = vm.createContext({ exports: {}, URL, URLSearchParams });
vm.runInContext(compiled, context);
const links = context.exports;
const assignment = '12345678-1234-4123-8123-123456789abc';
const nativeDestination = href => href.startsWith('intent:') ? href.split('#Intent;')[0].replace('intent:', 'https:') : href;

test('Android opens the app or goes straight to Play with the assigned preset and attribution', () => {
  const native = `https://app.myaiphotoshoot.com/open/preset/anime~${assignment}/?locale=ja&gclid=CaseSensitive&ga_handoff=consented-handoff`;
  const play = new URL(links.buildPresetGooglePlayUrl(`https://app.myaiphotoshoot.com/#preset/anime~${assignment}`));
  const referrer = new URLSearchParams(play.searchParams.get('referrer'));
  referrer.set('gclid', 'CaseSensitive');
  referrer.set('ga_handoff', 'consented-handoff');
  play.searchParams.set('referrer', referrer.toString());
  const intent = links.buildNativeAppOpenUrl(native, 'android', play.href);
  assert.equal(nativeDestination(intent), native);
  assert.ok(intent.includes('#Intent;scheme=https;package=com.myaiphotoshoot;'));
  assert.equal(decodeURIComponent(intent.split('S.browser_fallback_url=')[1].split(';end')[0]), play.href);
  assert.equal(links.buildNativeAppOpenUrl(native, 'ios', play.href), native);
  for (const invalid of ['https://example.com/open/preset/anime/', 'https://app.myaiphotoshoot.com/#preset/anime']) {
    assert.throws(() => links.buildNativeAppOpenUrl(invalid, 'android', play.href));
  }
  for (const invalid of ['https://example.com/', 'https://play.google.com/store/apps/details?id=another.app']) {
    assert.throws(() => links.buildNativeAppOpenUrl(native, 'android', invalid));
  }
});

test('native links preserve the assigned preset and locale', () => {
  const web = `https://app.myaiphotoshoot.com/#preset/anime~${assignment}`;
  assert.equal(links.buildPresetNativeAppUrl(web, 'ja'), `https://app.myaiphotoshoot.com/open/preset/anime~${assignment}/?locale=ja`);
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
    const messages = JSON.parse(await readFile(new URL(`../messages/${locale}/index.json`, import.meta.url), { encoding: 'utf8' }));
    assert.equal(typeof messages.presets.openInApp, 'string', locale);
    assert.ok(messages.presets.openInApp.trim(), locale);
  }
});

for (const userAgent of ['iPhone', 'Android Chrome']) test(`app action waits for the current assignment and never reuses a stale link on ${userAgent}`, async () => {
  const require = createRequire(import.meta.url);
  const states = [], effects = [], scheduled = [];
  let stateIndex = 0, effectIndex = 0, clicked = 0;
  const events = [];
  const window = new EventTarget();
  window.gtag = (...event) => events.push(event);
  let handoff = '';
  let installTarget;
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
  const ButtonSpinner = () => null;
  const StoreIcon = () => null;
  const dependencies = {
    react,
    '@/components/ui/LoadingSpinner': { ButtonSpinner },
    '@/components/ui/PlatformIcons': { StoreIcon },
    '@/components/layout/AndroidInstallLink': { usePageAndroidInstallLink: (pathname, url, pending, trackClick) => { installTarget = { pathname, url, pending, trackClick }; } },
    '@/lib/analytics': { withCurrentAttribution: url => handoff ? `${url}&ga_handoff=${handoff}` : url },
    '@/lib/landing-handoff': { LANDING_HANDOFF_UPDATED: 'landing-handoff-updated' },
    '@/lib/app-links': links,
    './PresetExperiment': { usePresetExperiment: () => preset },
  };
  const load = async file => {
    const compiledModule = { exports: {} };
    const source = await readFile(new URL(`../${file}`, import.meta.url), { encoding: 'utf8' });
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('module', 'exports', 'require', 'navigator', 'window', 'console', compiled)(
      compiledModule, compiledModule.exports, name => dependencies[name] ?? require(name),
      { userAgent, maxTouchPoints: 1 }, window, { info() {} },
    );
    return compiledModule.exports;
  };
  const component = (await load('src/components/presets/PresetAppLinks.tsx')).default;
  const render = () => {
    stateIndex = effectIndex = 0;
    return component({ presetId: 'preset-id', label: 'Open in app', pagePath: '/presets/anime/' });
  };
  const flush = () => { while (scheduled.length) scheduled.shift()(); };
  assert.equal(render(), null);
  flush();
  const waiting = render();
  assert.equal(waiting.props.href, undefined);
  assert.equal(waiting.props['aria-busy'], true);
  assert.equal(installTarget.pending, true);
  assert.equal(waiting.props.children[0].type, ButtonSpinner);
  let blocked = false;
  waiting.props.onClick({ preventDefault() { blocked = true; } });
  assert.equal(blocked, true);
  assert.equal(clicked, 0);
  preset = { ...preset, resolved: true, appUrl: `https://app.myaiphotoshoot.com/#preset/anime~${assignment}` };
  render(); flush();
  const ready = render();
  assert.equal(ready.props['aria-busy'], undefined);
  assert.equal(ready.props.children[0].type, StoreIcon);
  assert.equal(ready.props.children[0].props.platform, userAgent.includes('Android') ? 'android' : 'ios');
  assert.equal(installTarget.pending, false);
  assert.equal(installTarget.pathname, '/presets/anime/');
  assert.equal(new URLSearchParams(new URL(installTarget.url).searchParams.get('referrer')).get('preset'), `anime~${assignment}`);
  assert.equal(installTarget.trackClick, preset.trackClick);
  assert.equal(nativeDestination(ready.props.href), `https://app.myaiphotoshoot.com/open/preset/anime~${assignment}/?locale=en`);
  assert.equal(ready.props.href.startsWith('intent:'), userAgent.includes('Android'));
  assert.equal(ready.props.target, userAgent.includes('Android') ? '_blank' : undefined);
  if (userAgent.includes('Android')) {
    const play = new URL(decodeURIComponent(ready.props.href.split('S.browser_fallback_url=')[1].split(';end')[0]));
    assert.equal(play.hostname, 'play.google.com');
    assert.equal(new URLSearchParams(play.searchParams.get('referrer')).get('preset'), `anime~${assignment}`);
  }
  ready.props.onClick({ preventDefault() { assert.fail('resolved tap should navigate'); } });
  assert.equal(clicked, 1);
  assert.equal(events[0][1], 'preset_app_open_click');
  handoff = 'consented-handoff';
  window.dispatchEvent(new Event('landing-handoff-updated'));
  assert.ok(nativeDestination(render().props.href).endsWith('&ga_handoff=consented-handoff'));
  if (userAgent.includes('Android')) {
    assert.ok(decodeURIComponent(render().props.href.split('S.browser_fallback_url=')[1]).includes('&ga_handoff=consented-handoff'));
  }
  handoff = '';
  window.dispatchEvent(new Event('consent-choice-changed'));
  assert.equal(render().props.href.includes('ga_handoff'), false);
  preset = { ...preset, appUrl: 'https://app.myaiphotoshoot.com/#preset/anime' };
  assert.equal(render().props.href, undefined);
  assert.equal(new URLSearchParams(new URL(installTarget.url).searchParams.get('referrer')).get('preset'), 'anime');
  flush();
  assert.equal(nativeDestination(render().props.href), 'https://app.myaiphotoshoot.com/open/preset/anime/?locale=en');
  preset = { ...preset, locale: 'ja' };
  assert.equal(render().props.href, undefined, 'locale changes must not reuse the previous native link');
  flush();
  assert.equal(new URL(nativeDestination(render().props.href)).searchParams.get('locale'), 'ja');
  preset = { ...preset, resolved: false, pending: true };
  assert.equal(render().props.href, undefined);
  flush();
  for (const effect of effects) effect.cleanup?.();
});
