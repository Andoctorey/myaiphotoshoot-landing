import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';

const assignment = '12345678-1234-4123-8123-123456789abc';
const mask = '87654321-4321-4321-8321-cba987654321';
const nextMask = '12345678-1234-4123-8123-123456789abc';
const referrer = url => new URLSearchParams(new URL(url).searchParams.get('referrer'));

function pageHarness(userAgent = 'Android Chrome') {
  const require = createRequire(import.meta.url);
  const contexts = new Map(), frames = new Map(), modules = new Map(), scheduled = [];
  let pathname = '/presets/anime/', frame;
  const storage = new Map();
  const window = Object.assign(new EventTarget(), {
    navigator: { userAgent, maxTouchPoints: 1 },
    location: { pathname, origin: 'https://myaiphotoshoot.com', search: '?gclid=click&email=private' },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  const react = {
    ...React,
    createContext(value) { const context = React.createContext(value); contexts.set(context, value); return context; },
    useContext: context => contexts.get(context),
    useState(initial) {
      const owner = frame, index = frame.stateIndex++;
      if (!(index in owner.states)) owner.states[index] = typeof initial === 'function' ? initial() : initial;
      return [owner.states[index], value => { owner.states[index] = typeof value === 'function' ? value(owner.states[index]) : value; }];
    },
    useEffect(callback, deps) {
      const owner = frame, index = frame.effectIndex++;
      if (!owner.effects[index] || deps.some((value, i) => value !== owner.effects[index].deps[i])) {
        scheduled.push(() => {
          owner.effects[index]?.cleanup?.();
          owner.effects[index] = { deps, cleanup: callback() };
        });
      }
    },
  };
  function render(name, callback) {
    if (!frames.has(name)) frames.set(name, { states: [], effects: [] });
    frame = frames.get(name);
    frame.stateIndex = frame.effectIndex = 0;
    return callback();
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const module = { exports: {} };
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const dependencies = name => {
      if (name === 'react') return react;
      if (name === 'next/navigation') return { usePathname: () => pathname };
      if (name === 'next/image') return { default: 'img' };
      if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
      if (name === './landing-handoff' || name === '@/lib/landing-handoff') {
        return { LANDING_HANDOFF_PARAMETER: 'ga_handoff', LANDING_HANDOFF_UPDATED: 'landing-handoff-updated', readLandingHandoff: () => null };
      }
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.${name.includes('/components/') ? 'tsx' : 'ts'}`);
      if (name === './app-links') return load('src/lib/app-links.ts');
      if (name === './MaskAppLink') return load('src/components/masks/MaskAppLink.tsx');
      return require(name);
    };
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function('module', 'exports', 'require', 'window', 'navigator', compiled)(module, module.exports, dependencies, window, window.navigator);
    modules.set(file, module.exports);
    return module.exports;
  }
  const shared = load('src/components/layout/AndroidInstallLink.tsx');
  const hooks = load('src/hooks/usePlatformAppLink.ts');
  const links = load('src/lib/app-links.ts');
  const attribution = load('src/lib/analytics.ts');
  function shell() {
    const outer = render('provider', () => shared.AndroidInstallLinkProvider({ children: null }));
    contexts.set(outer.type, outer.props.value);
    const inner = outer.props.children;
    contexts.set(inner.type, inner.props.value);
  }
  function flush() { while (scheduled.length) scheduled.shift()(); }
  return {
    links, attribution,
    navigate(value) { pathname = window.location.pathname = value; shell(); },
    publish(url, pending = false, trackClick, sourcePathname = pathname) {
      shell();
      render('publisher', () => shared.usePageAndroidInstallLink(sourcePathname, url, pending, trackClick));
      flush();
    },
    selections() {
      let result;
      for (let i = 0; i < 3; i++) {
        shell();
        result = ['header', 'footer'].map(name => render(name, () => hooks.usePlatformAppLink()));
        flush();
      }
      return result;
    },
    highlight(props) {
      shell();
      const component = load('src/components/masks/AiMaskCategoryHighlights.tsx').default;
      const result = render('highlight', () => component(props));
      flush();
      return result;
    },
    dispose() { for (const owner of frames.values()) for (const effect of owner.effects) effect?.cleanup?.(); },
  };
}

function descendants(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(descendants);
  return [element, ...descendants(element.props?.children)];
}

test('both Android shell links wait for assignments, preserve them through click attribution, and clear stale page targets', t => {
  const page = pageHarness();
  t.after(() => page.dispose());
  assert.ok(page.selections().every(link => link.pending));
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/anime'), true);
  assert.ok(page.selections().every(link => link.pending));
  let clicks = 0;
  page.publish(page.links.buildPresetGooglePlayUrl(`https://app.myaiphotoshoot.com/#preset/anime~${assignment}`), false, () => clicks++);
  for (const link of page.selections()) {
    assert.equal(link.pending, false);
    assert.equal(link.event, 'google_play_cta_click');
    const selected = referrer(page.attribution.withCurrentAttribution(link.url));
    assert.equal(selected.get('preset'), `anime~${assignment}`);
    assert.equal(selected.get('gclid'), 'click');
    assert.equal(selected.has('email'), false);
    link.trackClick();
  }
  assert.equal(clicks, 2);
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/anime'), true);
  assert.ok(page.selections().every(link => link.pending));
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/anime'));
  assert.ok(page.selections().every(link => referrer(link.url).get('preset') === 'anime'));
  page.navigate('/ja/presets/another/');
  assert.ok(page.selections().every(link => link.pending));
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/anime'), false, undefined, '/presets/anime/');
  assert.ok(page.selections().every(link => link.pending), 'old content must not publish its selection under the new route');
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/another'));
  assert.ok(page.selections().every(link => referrer(link.url).get('preset') === 'another'));
  page.navigate('/en/presets/anime/');
  page.publish(page.links.buildPresetGooglePlayUrl('https://app.myaiphotoshoot.com/#preset/anime'), false, undefined, '/presets/anime/');
  assert.ok(page.selections().every(link => !link.pending && referrer(link.url).get('preset') === 'anime'));
  page.navigate('/');
  assert.ok(page.selections().every(link => !link.pending && !referrer(link.url).has('preset') && !link.trackClick));
});

test('changing the selected mask and gender updates both shell links, and the catalog does not reuse a selected mask', t => {
  const page = pageHarness();
  t.after(() => page.dispose());
  page.navigate('/masks/hair/');
  const props = {
    category: { id: 'hair', slug: 'hair', name: 'Hair', audienceGender: 'unisex', sourceImageVariants: {} },
    masks: [mask, nextMask].map((id, index) => ({ id, name: `Look ${index}`, featuredGraphics: 'https://example.com/mask.jpg', featuredGraphicsVariants: {}, priceCredits: 4 })),
    locale: 'en', pagePath: '/masks/hair/', beforeLabel: 'Before', femaleLabel: 'Female', maleLabel: 'Male',
    genderLabel: 'Gender', holdToCompareLabel: 'Compare', resultAltLabel: '{name}', tryMasksLabel: 'Try on web', openInAppLabel: 'Open in app',
  };
  let view = page.highlight(props);
  assert.ok(page.selections().every(link => referrer(link.url).get('mask') === mask && referrer(link.url).get('gender') === 'female'));
  descendants(view).find(element => element.type === 'button' && element.props['aria-label'] === 'Male').props.onClick();
  view = page.highlight(props);
  descendants(view).find(element => element.type === 'button' && element.props['aria-label'] === 'Look 1').props.onClick();
  page.highlight(props);
  for (const link of page.selections()) {
    const selected = referrer(page.attribution.withCurrentAttribution(link.url));
    assert.equal(selected.get('mask'), nextMask);
    assert.equal(selected.get('gender'), 'male');
    assert.equal(selected.has('preset'), false);
  }
  page.navigate('/masks/');
  assert.ok(page.selections().every(link => link.pending));
  page.publish(page.links.buildMaskGooglePlayUrl());
  assert.ok(page.selections().every(link => referrer(link.url).get('mask') === 'all' && !referrer(link.url).has('gender')));
});

test('page selections do not change iOS and desktop destinations', t => {
  for (const [userAgent, destination] of [['iPhone Safari', 'https://apps.apple.com/app/id6744860178'], ['Macintosh Safari', 'https://app.myaiphotoshoot.com/#ideas']]) {
    const page = pageHarness(userAgent);
    t.after(() => page.dispose());
    page.publish(page.links.buildMaskGooglePlayUrl(mask, 'male'), true);
    for (const link of page.selections()) {
      const actual = new URL(link.url), expected = new URL(destination);
      assert.equal(actual.origin + actual.pathname + actual.hash, expected.origin + expected.pathname + expected.hash);
      assert.equal(actual.searchParams.has('referrer'), false);
      assert.equal(!!link.pending, false);
      assert.equal(link.trackClick, undefined);
    }
  }
});
