import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const appLinks = vm.createContext({ exports: {}, URL, URLSearchParams });
vm.runInContext(compile(await readFile(new URL('../src/lib/app-links.ts', import.meta.url), 'utf8')), appLinks);
const links = appLinks.exports;
const mask = '87654321-4321-4321-8321-cba987654321';
const nativeDestination = href => href.startsWith('intent:') ? href.split('#Intent;')[0].replace('intent:', 'https:') : href;

test('mask native and web actions keep the same selected mask and preview gender', () => {
  assert.equal(links.buildMaskAppUrl(mask), `https://app.myaiphotoshoot.com/#masks/${mask}`);
  assert.equal(links.buildMaskAppUrl(mask, 'male'), `https://app.myaiphotoshoot.com/#masks/${mask}/gender/male`);
  assert.equal(links.buildMaskNativeAppUrl(mask, 'ja', 'male'), `https://app.myaiphotoshoot.com/open/mask/${mask}/?locale=ja&gender=male`);
  assert.equal(links.buildMaskNativeAppUrl(undefined, 'en'), 'https://app.myaiphotoshoot.com/open/mask/all/?locale=en');
  for (const value of ['', 'all', 'https://example.com', `${mask}/other`, 'not-a-mask']) {
    assert.throws(() => links.buildMaskNativeAppUrl(value, 'en'));
  }
});

async function componentHarness(userAgent, maxTouchPoints = 1) {
  const require = createRequire(import.meta.url);
  const states = [], effects = [], scheduled = [], events = [];
  let stateIndex = 0, effectIndex = 0;
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect(callback, deps) {
      const index = effectIndex++;
      if (!effects[index] || deps.some((value, i) => value !== effects[index][i])) {
        scheduled.push(() => { effects[index] = deps; callback(); });
      }
    },
  };
  const dependencies = {
    react,
    '@/components/ui/PlatformIcons': { StoreIcon: () => null },
    '@/lib/app-links': links,
    '@/components/layout/AndroidInstallLink': { useAndroidInstallLink: () => ({ pending: false }) },
    '@/lib/landing-handoff': { LANDING_HANDOFF_UPDATED: 'landing-handoff-updated' },
    '@/lib/analytics': { withCurrentAttribution(value) {
      const url = new URL(value);
      url.searchParams.set('gclid', 'CaseSensitive');
      return url.href;
    } },
  };
  const load = async file => {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const module = { exports: {} };
    new Function('module', 'exports', 'require', 'navigator', 'window', 'console', compile(source))(
      module, module.exports, name => dependencies[name] ?? require(name),
      { userAgent, maxTouchPoints },
      { gtag: (...event) => events.push(event), addEventListener() {}, removeEventListener() {} },
      { info() {} },
    );
    return module.exports;
  };
  dependencies['@/hooks/usePlatformAppLink'] = await load('src/hooks/usePlatformAppLink.ts');
  const component = (await load('src/components/masks/MaskAppLink.tsx')).default;
  return {
    events,
    render(props = {}) {
      stateIndex = effectIndex = 0;
      return component({ label: 'Open in app', locale: 'en', maskId: mask, ...props });
    },
    flush() { while (scheduled.length) scheduled.shift()(); },
  };
}

test('changing a selected mask or gender never navigates to the preceding selection', async () => {
  const page = await componentHarness('Mozilla Android Chrome');
  assert.equal(page.render(), null);
  page.flush();
  assert.equal(new URL(nativeDestination(page.render().props.href)).searchParams.get('gclid'), 'CaseSensitive');
  const nextMask = '12345678-1234-4123-8123-123456789abc';
  const next = page.render({ maskId: nextMask, maskName: 'Smile', gender: 'female' });
  assert.ok(next.props.href.startsWith('intent:'));
  const destination = new URL(nativeDestination(next.props.href));
  assert.equal(destination.pathname, `/open/mask/${nextMask}/`);
  assert.equal(destination.searchParams.get('gender'), 'female');
  const play = new URL(decodeURIComponent(next.props.href.split('S.browser_fallback_url=')[1].split(';end')[0]));
  const installSelection = new URLSearchParams(play.searchParams.get('referrer'));
  assert.equal(play.hostname, 'play.google.com');
  assert.equal(installSelection.get('mask'), nextMask);
  assert.equal(installSelection.get('gender'), 'female');
  assert.equal(next.props.target, '_blank');
  assert.equal(next.props['aria-label'], 'Open in app: Smile');
  page.flush();
  page.render({ maskId: nextMask, gender: 'female' }).props.onClick();
  assert.equal(page.events[0][1], 'mask_app_open_click');
  assert.equal(page.events[0][2].mask_id, nextMask);
});

test('native actions respect iOS-only restrictions while web mask cards remain available', async () => {
  for (const [userAgent, touchPoints, visible] of [
    ['Mozilla iPhone Safari', 1, false],
    ['Mozilla Macintosh Safari', 5, false],
    ['Mozilla Macintosh Safari', 0, false],
    ['Mozilla Android Chrome', 1, true],
  ]) {
    const page = await componentHarness(userAgent, touchPoints);
    page.render({ hiddenOnIos: true }); page.flush();
    assert.equal(page.render({ hiddenOnIos: true }) !== null, visible, userAgent);
  }
  const ios = await componentHarness('Mozilla iPhone Safari');
  ios.render(); ios.flush();
  assert.equal(ios.render().props.href.startsWith('https://app.myaiphotoshoot.com/open/mask/'), true);
  assert.equal(ios.render().props.target, undefined);
});

test('every landing locale translates the mask action', async () => {
  for (const locale of ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar']) {
    const messages = JSON.parse(await readFile(new URL(`../messages/${locale}/index.json`, import.meta.url), 'utf8'));
    assert.equal(typeof messages.masks.openInApp, 'string', locale);
    assert.ok(messages.masks.openInApp.trim(), locale);
  }
});
