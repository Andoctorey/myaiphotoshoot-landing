import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator } from 'next-intl';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const localeCodes = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];
const englishShareTitle = 'One AI Photoshoot. Every Version of You.';
const englishShareDescription = 'Create realistic headshots, profile pictures, portraits, avatars, and new looks from your photo with My AI Photoshoot.';
const commercialShareClaim = /(?:[$€£¥₹₽]\s*\d|\d+\s*cr\b|\b(?:credits?|pro|max|subscriptions?|subs?|pay[\s-]*as[\s-]*you[\s-]*go|plans?|pricing|prices?|resolution|[1248]k)\b|cr[eé]dit(?:s|os)?|kredit(?:e|en|s)?|abonnement|suscripci[oó]n|forfait|tarif|кредит|подписк|тариф|积分|订阅|套餐|クレジット|サブスクリプション|プラン|क्रेडिट|सदस्यता|प्लान|أرصدة|رصيد|اشتراك|خطة|الدقة|auflösung|r[ée]solution|resoluci[oó]n|разрешени|分辨率|画质|解像度|रिज़ॉल्यूशन)/iu;

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), { encoding: 'utf8' });
}

/**
 * @typedef {{
 *   'src/lib/pricing.ts': typeof import('../src/lib/pricing'),
 *   'src/lib/models.ts': typeof import('../src/lib/models'),
 *   'src/lib/regional-pricing.ts': typeof import('../src/lib/regional-pricing'),
 *   'src/lib/app-links.ts': typeof import('../src/lib/app-links'),
 *   'src/lib/json-ld.ts': typeof import('../src/lib/json-ld'),
 *   'src/lib/seo.ts': typeof import('../src/lib/seo'),
 *   'src/components/studio/StudioPage.tsx': typeof import('../src/components/studio/StudioPage'),
 *   'src/components/layout/Footer.tsx': typeof import('../src/components/layout/Footer'),
 *   'src/lib/blog-static-params.ts': typeof import('../src/lib/blog-static-params'),
 *   'src/lib/ai-preset-catalog.ts': typeof import('../src/lib/ai-preset-catalog'),
 *   'src/lib/ai-presets.ts': typeof import('../src/lib/ai-presets'),
 *   'src/lib/ai-masks.ts': typeof import('../src/lib/ai-masks'),
 *   'src/components/features/PricingOfferList.tsx': typeof import('../src/components/features/PricingOfferList')
 * }} TestModules
 */

/**
 * @template {keyof TestModules} P
 * @param {P} relativePath
 * @param {Record<string, unknown>} [dependencies]
 * @returns {Promise<TestModules[P]>}
 */
async function loadTypeScriptModule(relativePath, dependencies = {}) {
  const source = await readProjectFile(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: path.basename(relativePath),
  }).outputText;
  const loadedModule = { exports: {} };
  const evaluate = new Function('exports', 'module', 'require', `${output}\nreturn module.exports;`);
  const localRequire = (specifier) => dependencies[specifier] ?? require(specifier);
  return evaluate(loadedModule.exports, loadedModule, localRequire);
}

async function loadPricingModule() {
  return loadTypeScriptModule('src/lib/pricing.ts');
}

async function loadModelsModule(pricing) {
  return loadTypeScriptModule('src/lib/models.ts', {
    '@/lib/pricing': pricing,
  });
}

function valueAtPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object);
}

/** @returns {string[]} */
function leafPaths(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value)
    .flatMap(([key, nestedValue]) => leafPaths(nestedValue, prefix ? `${prefix}.${key}` : key))
    .sort();
}

function placeholders(value) {
  return Array.from(
    String(value).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?=\s*[,}])/g),
    (match) => match[1],
  ).sort();
}

test('V2 reference offers separate weekly grants from one-time credits', async () => {
  const { US_REFERENCE_PRICING: catalog, annualSavingsPercent } = await loadPricingModule();
  assert.equal(catalog.catalogVersion, 'v2');
  assert.equal(catalog.currency, 'USD');
  assert.deepEqual(catalog.subscriptions.map((offer) => [
    offer.id, offer.price, offer.credits, offer.creditGrantPeriod,
  ]), [
    ['v2:annual', 29.99, 40, 'weekly'],
    ['v2:weekly', 2.99, 40, 'weekly'],
  ]);
  assert.deepEqual(catalog.packages.map((offer) => [
    offer.id, offer.price, offer.credits, offer.creditGrantPeriod,
  ]), [
    ['v2_package_10', 0.99, 10, 'oneTime'],
    ['v2_package_100', 5.99, 100, 'oneTime'],
    ['v2_package_500', 14.99, 500, 'oneTime'],
  ]);
  assert.equal(annualSavingsPercent(catalog.subscriptions), 81);
  assert.equal(annualSavingsPercent([catalog.subscriptions[0]]), null);
  assert.equal(annualSavingsPercent([
    catalog.subscriptions[0], { ...catalog.subscriptions[1], credits: 20 },
  ]), null, 'Different weekly allowances cannot share a savings claim');
  assert.equal(annualSavingsPercent([
    { ...catalog.subscriptions[0], price: 200 }, catalog.subscriptions[1],
  ]), null, 'A more expensive yearly offer must not claim savings');
});

test('credit labels format backend amounts without currency conversion', async () => {
  const { formatCredits } = await loadPricingModule();

  assert.equal(formatCredits(7, 'en'), '7 CR');
  assert.equal(formatCredits(1000, 'de'), '1.000 CR');
});

test('photo estimates match KMP at four credits per base photo', async () => {
  const { estimatedPhotoCount } = await loadPricingModule();
  assert.deepEqual([10, 40, 100, 500].map(estimatedPhotoCount), [2, 10, 25, 125]);
});

test('credit pack savings compare localized unit prices with the smallest pack', async () => {
  const { US_REFERENCE_PRICING, creditPackSavingsPercent } = await loadPricingModule();
  const offers = US_REFERENCE_PRICING.packages;
  assert.equal(creditPackSavingsPercent(offers, offers[0]), null);
  assert.equal(creditPackSavingsPercent(offers, offers[1]), 39);
  assert.equal(creditPackSavingsPercent([...offers].reverse(), offers[2]), 70);

  const { pricingCatalogFromApi } = await loadTypeScriptModule('src/lib/regional-pricing.ts');
  const localized = pricingCatalogFromApi(v2PricingResponse()).packages;
  assert.equal(creditPackSavingsPercent(localized, localized[1]), 40);
  assert.equal(creditPackSavingsPercent(localized, localized[2]), 70);
});

test('credit pack savings omit incomparable prices and packs with no discount', async () => {
  const { US_REFERENCE_PRICING, creditPackSavingsPercent } = await loadPricingModule();
  const [smallest, larger] = US_REFERENCE_PRICING.packages;
  assert.equal(creditPackSavingsPercent([], larger), null);
  assert.equal(creditPackSavingsPercent([larger], larger), null);
  for (const price of [9.9, 12, 0, -1, NaN, Infinity]) {
    const offer = { ...larger, price };
    assert.equal(creditPackSavingsPercent([smallest, offer], offer), null);
  }
  assert.equal(creditPackSavingsPercent([{ ...smallest, price: 0 }, larger], larger), null);
});

test('Studio reference costs match automatic generation and optional personal models', async () => {
  const pricing = await loadPricingModule();
  const models = await loadModelsModule(pricing);
  assert.equal(models.studioPhotoCredits, 4);
  assert.deepEqual(models.personalModelCosts, {
    imageCredits: 2,
    standardTrainingCredits: 150,
    fullTrainingCredits: 300,
  });
});

function v2PricingResponse() {
  return {
    country_code: 'TH',
    country_group: null,
    catalog_version: 'v2',
    adaptive_pricing: true,
    packages: [
      { product_id: 'v2_package_10', included_credits: 10, value: 33, currency: 'THB' },
      { product_id: 'v2_package_100', included_credits: 100, value: 199, currency: 'THB' },
      { product_id: 'v2_package_500', included_credits: 500, value: 499, currency: 'THB' },
    ],
    plans: [
      { product_id: 'v2', base_plan_id: 'weekly', included_credits: 40, value: 99, currency: 'THB' },
      { product_id: 'v2', base_plan_id: 'annual', included_credits: 40, value: 999, currency: 'THB' },
    ],
  };
}

test('regional V2 pricing accepts null country groups and preserves weekly annual grants', async () => {
  const { pricingCatalogFromApi } = await loadTypeScriptModule('src/lib/regional-pricing.ts');
  const response = v2PricingResponse();
  const catalog = pricingCatalogFromApi(response);
  assert.ok(catalog);
  assert.equal(catalog.referenceMarket, 'TH');
  assert.equal(catalog.currency, 'THB');
  assert.deepEqual(catalog.subscriptions.map((offer) => [
    offer.id, offer.price, offer.credits, offer.creditGrantPeriod,
  ]), [
    ['v2:annual', 999, 40, 'weekly'],
    ['v2:weekly', 99, 40, 'weekly'],
  ]);
  assert.deepEqual(catalog.packages.map((offer) => [offer.credits, offer.price]), [
    [10, 33], [100, 199], [500, 499],
  ]);
  assert.deepEqual(pricingCatalogFromApi({
    ...response,
    packages: [...response.packages, { product_id: 'future_package' }],
    plans: [...response.plans, { product_id: 'v2', base_plan_id: 'quarterly' }],
  }), catalog);
});

test('invalid or legacy pricing cannot replace the V2 reference catalog', async () => {
  const { pricingCatalogFromApi } = await loadTypeScriptModule('src/lib/regional-pricing.ts');
  const mutate = (change) => {
    const response = v2PricingResponse();
    change(response);
    return pricingCatalogFromApi(response);
  };
  assert.equal(mutate((r) => { r.catalog_version = 'legacy'; }), null);
  assert.equal(mutate((r) => { delete r.catalog_version; }), null);
  assert.equal(mutate((r) => { r.plans[0].currency = 'USD'; }), null);
  assert.equal(mutate((r) => { r.packages[0].value = -1; }), null);
  assert.equal(mutate((r) => { r.packages[0].included_credits = 0.5; }), null);
  assert.equal(mutate((r) => { r.plans.push(r.plans[0]); }), null);
  assert.equal(mutate((r) => { r.packages = []; }), null);
});

test('pricing requests V2 with country first and locale fallback, without forwarding private headers', async (t) => {
  const { onRequest, resolvePricingCountry } = await import(
    pathToFileURL(path.join(projectRoot, 'functions/pricing.js')).href
  );
  assert.equal(resolvePricingCountry('th', 'en'), 'TH');
  assert.equal(resolvePricingCountry('XX', 'hi'), 'IN');
  assert.equal(resolvePricingCountry(undefined, 'zh-Hans'), 'CN');
  assert.equal(resolvePricingCountry(undefined, 'unknown'), 'US');
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json(v2PricingResponse());
  });
  const methodResponse = await onRequest({
    request: new Request('https://myaiphotoshoot.com/pricing', { method: 'POST' }),
  });
  assert.equal(methodResponse.status, 405);
  assert.equal(methodResponse.headers.get('allow'), 'GET');
  assert.equal(calls.length, 0);

  const request = new Request('https://myaiphotoshoot.com/pricing?locale=en', {
    headers: { authorization: 'private-token', cookie: 'private-cookie' },
  });
  Object.defineProperty(request, 'cf', { value: { country: 'th' } });
  const response = await onRequest({ request });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.deepEqual(await response.json(), v2PricingResponse());
  assert.equal(
    calls[0].url,
    'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1/stripe-pricing?country_code=TH',
  );
  const headers = new Headers(calls[0].options.headers);
  assert.equal(headers.get('x-app-version'), '1.13.0');
  assert.equal(headers.has('authorization'), false);
  assert.equal(headers.has('cookie'), false);

  await onRequest({ request: new Request('https://myaiphotoshoot.com/pricing?locale=hi') });
  assert.match(calls[1].url, /country_code=IN$/);
  const routes = JSON.parse(await readProjectFile('public/_routes.json'));
  assert.equal(routes.include.includes('/pricing'), true);
  assert.equal(routes.include.includes('/pricing/'), true);
});

test('pricing upstream failures return an uncached error for the reference-price fallback', async (t) => {
  const { onRequest } = await import(pathToFileURL(path.join(projectRoot, 'functions/pricing.js')).href);
  const log = t.mock.method(console, 'error', () => {});
  const upstream = t.mock.method(globalThis, 'fetch', async () => (
    new Response('Unavailable', { status: 503 })
  ));
  const request = new Request('https://myaiphotoshoot.com/pricing');
  const response = await onRequest({ request });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(log.mock.callCount(), 1);
  upstream.mock.mockImplementation(async () => { throw new Error('Network timeout'); });
  assert.equal((await onRequest({ request })).status, 502);
});

test('all locales provide the repositioned copy used by the UI', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));
  const requiredPaths = [
    'hero.description',
    'navigation.skipToContent',
    'navigation.mainNavigation',
    'navigation.openMenu',
    'navigation.closeMenu',
    'navigation.studio',
    'footer.imageLicense',
    'footer.studio',
    'pageCopy.home.metaTitle',
    'pageCopy.home.metaDescription',
    'pageCopy.home.shareTitle',
    'pageCopy.home.shareDescription',
    'pageCopy.useCases.title',
    'pageCopy.useCases.intro',
    'pageCopy.useCases.metaTitle',
    'pageCopy.useCases.metaDescription',
    'pricing.referenceDisclosure',
    'pricing.subscription.expiry',
    'pricing.packs.expiry',
    'pricing.billing.annualCharge',
    'pricing.billing.weeklyPrice',
    'pricing.subscription.title',
    'pricing.packs.title',
    'pricing.photoEstimate',
    'pricing.weeklyPhotoEstimate',
    'faq.creditExpiry.question',
    'faq.creditExpiry.answer',
    'faq.pricing.answer',
    'faq.subscriptions.answer',
    'useCase.fallbackDescription',
    'useCase.galleryDisclaimer',
    'useCase.howItWorks.step1.title',
    'useCase.howItWorks.step1.desc',
    'useCase.howItWorks.step2.title',
    'useCase.howItWorks.step2.desc',
    'useCase.howItWorks.step3.title',
    'useCase.howItWorks.step3.desc',
    'useCase.cta.title',
    'useCase.cta.description',
    'useCase.cta.primary',
    'useCase.cta.pricing',
    'useCase.schema.serviceType',
    'studio.meta.imageAlt',
    'masks.creditCost',
  ];
  const studioPaths = leafPaths(english.studio).map((dottedPath) => `studio.${dottedPath}`);
  const allRequiredPaths = [...new Set([...requiredPaths, ...studioPaths])];

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    assert.equal(Object.hasOwn(messages, 'models'), false, `${locale} still contains the retired models namespace`);
    assert.equal(Object.hasOwn(messages.navigation, 'models'), false, `${locale} still contains navigation.models`);
    assert.equal(Object.hasOwn(messages.footer, 'models'), false, `${locale} still contains footer.models`);
    for (const dottedPath of allRequiredPaths) {
      const value = valueAtPath(messages, dottedPath);
      assert.equal(
        typeof value === 'string' && value.trim().length > 0,
        true,
        `${locale} is missing ${dottedPath}`,
      );
    }
  }
});

test('localized changed namespaces stay in lockstep with English', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));

  for (const locale of localeCodes.filter((code) => code !== 'en')) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const namespace of ['pricing', 'studio', 'faq', 'pageCopy', 'useCase']) {
      assert.equal(
        Boolean(messages[namespace]) && typeof messages[namespace] === 'object',
        true,
        `${locale}.${namespace} is missing`,
      );
      assert.deepEqual(
        leafPaths(messages[namespace]),
        leafPaths(english[namespace]),
        `${locale}.${namespace} keys differ from English`,
      );
      for (const dottedPath of leafPaths(english[namespace])) {
        assert.deepEqual(
          placeholders(valueAtPath(messages[namespace], dottedPath)),
          placeholders(valueAtPath(english[namespace], dottedPath)),
          `${locale}.${namespace}.${dottedPath} placeholders differ from English`,
        );
      }
    }
  }
});

test('creation and editing stay ahead of optional personal-model training', async () => {
  const [homeSource, studioSource, useCaseSource] = await Promise.all([
    readProjectFile('src/components/features/HomeContent.tsx'),
    readProjectFile('src/components/studio/StudioPage.tsx'),
    readProjectFile('src/app/[locale]/use-cases/[slug]/UseCasePageClient.tsx'),
  ]);

  const homeOrder = [
    '<Hero locale={locale}',
    '<Pricing locale={locale}',
    '<HomePresets locale={locale}',
    '<HomeMasks locale={locale}',
  ].map((token) => homeSource.indexOf(token));
  assert.equal(homeOrder.every((position) => position >= 0), true, 'homepage sections are missing');
  assert.deepEqual(homeOrder, [...homeOrder].sort((a, b) => a - b));

  const studioOrder = [
    "t('steps.eyebrow')",
    "t('starts.eyebrow')",
    "t('autoMode.eyebrow')",
    "t('credits.title')",
    "t('personal.eyebrow')",
  ].map((token) => studioSource.indexOf(token));
  assert.equal(studioOrder.every((position) => position >= 0), true, 'Studio sections are missing');
  assert.deepEqual(studioOrder, [...studioOrder].sort((a, b) => a - b));
  assert.match(studioSource, /stepKeys\.map\(\(key, index\) =>/);
  assert.match(studioSource, /sourceKeys\.map\(\(key, index\) =>/);
  assert.doesNotMatch(useCaseSource, /howItWorks\.step[123]\.time/);

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const step of ['step1', 'step2', 'step3']) {
      assert.equal('time' in messages.useCase.howItWorks[step], false, `${locale} still has ${step} timing copy`);
    }
  }
});

test('Studio renders automatic generation costs and matching FAQ data in every locale', async () => {
  const pricing = await loadPricingModule();
  const models = await loadModelsModule(pricing);
  const appLinks = await loadTypeScriptModule('src/lib/app-links.ts');
  const jsonLd = await loadTypeScriptModule('src/lib/json-ld.ts');
  const seo = await loadTypeScriptModule('src/lib/seo.ts');
  const text = (html) => html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    const translate = (namespace) => createTranslator({
      locale,
      messages,
      namespace,
      onError: (error) => { throw error; },
    });
    const t = translate('studio');
    const { default: StudioPage } = await loadTypeScriptModule('src/components/studio/StudioPage.tsx', {
      'next-intl/server': { getTranslations: async ({ namespace }) => translate(namespace) },
      'next/link': { default: (props) => createElement('a', props) },
      '@/components/features/PlatformButtons': {
        default: ({ webAppUrl, webAppLabel }) => createElement('a', { href: webAppUrl }, webAppLabel),
      },
      '@/lib/app-links': appLinks,
      '@/lib/json-ld': jsonLd,
      '@/lib/models': models,
      '@/lib/seo': seo,
    });
    const html = renderToStaticMarkup(await StudioPage({ locale }));
    const script = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    assert.ok(script, locale);
    const schema = JSON.parse(script[1]);
    const visibleText = text(html.replace(script[0], ''));
    const costs = text(html.match(/<dl\b[^>]*>(.*?)<\/dl>/s)?.[1] ?? '');
    for (const [source, credits] of [['photo', 4], ['personal', 2]]) {
      assert.ok(costs.includes(t(`credits.${source}`) + t('credits.perPhoto', {
        credits: new Intl.NumberFormat(locale).format(credits),
      })), locale);
    }
    assert.ok(visibleText.includes(t('autoMode.control')), locale);
    assert.ok(visibleText.includes(t('credits.note')), locale);
    assert.doesNotMatch(html, /<(?:table|input)\b|role="slider"|[124]K/, locale);
    assert.equal(schema.url, seo.canonicalUrl(locale, '/studio/'), locale);
    assert.equal(schema.description, t('meta.description'), locale);
    assert.deepEqual(schema.mainEntity, ['writing', 'autoMode', 'credits', 'personal', 'required'].map((key) => ({
      '@type': 'Question',
      name: t(`faq.${key}.question`),
      acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.answer`) },
    })), locale);
    for (const question of schema.mainEntity) {
      assert.ok(visibleText.includes(question.name), locale);
      assert.ok(visibleText.includes(question.acceptedAnswer.text), locale);
    }
    assert.equal(html.split(`href="${appLinks.WEB_APP_STUDIO_URL}"`).length - 1, 2, locale);
  }
});

test('web app buttons outside pricing retain their existing black backgrounds', async () => {
  const [
    platformButtons,
    maskHighlights,
    maskLanding,
    masksCatalog,
    masksBrowser,
    useCase,
  ] = await Promise.all([
    readProjectFile('src/components/features/PlatformButtons.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryHighlights.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryLandingPage.tsx'),
    readProjectFile('src/components/masks/AiMasksCatalog.tsx'),
    readProjectFile('src/components/masks/MasksCatalogBrowser.tsx'),
    readProjectFile('src/app/[locale]/use-cases/[slug]/UseCasePageClient.tsx'),
  ]);

  assert.match(platformButtons, /href=\{attributedWebAppUrl\}[\s\S]{0,300}className="[^"]*bg-black/);
  assert.match(maskHighlights, /href=\{buildMaskAppUrl\(selectedMask\.id, gender\)\}[\s\S]{0,300}className="[^"]*bg-black/);
  assert.match(maskLanding, /href=\{AI_MASKS_APP_URL\}[\s\S]{0,300}className="[^"]*bg-black/);
  assert.match(masksCatalog, /href=\{AI_MASKS_APP_URL\}[\s\S]{0,300}className="[^"]*bg-black/);
  assert.match(masksBrowser, /href=\{AI_MASKS_APP_URL\}[\s\S]{0,300}className="[^"]*bg-black/);
  assert.equal((useCase.match(/href=\{attributedWebAppUrl\}[\s\S]{0,1000}?\bbg-black\b/g) || []).length, 4);
});

test('footer app button stays black while its install link is pending and ready', async () => {
  const appLink = { url: 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot', pending: true };
  const { default: Footer } = await loadTypeScriptModule('src/components/layout/Footer.tsx', {
    '@/lib/utils': { useTranslations: (namespace) => (key) => `${namespace}.${key}` },
    'next/link': { default: (props) => createElement('a', props) },
    'next/navigation': { usePathname: () => '/' },
    '@/lib/analytics': {},
    '@/i18n/request': { locales: localeCodes },
    '@/lib/seo': await loadTypeScriptModule('src/lib/seo.ts'),
    '@/hooks/usePlatformAppLink': { usePlatformAppLink: () => appLink },
  });

  for (const pending of [true, false]) {
    appLink.pending = pending;
    const html = renderToStaticMarkup(createElement(Footer));
    const button = html.match(/<a\b[^>]*aria-label="blog\.cta\.button"[^>]*>/)?.[0];
    assert.ok(button, 'Footer app button is missing');
    assert.ok(button.match(/class="([^"]*)"/)?.[1].split(/\s+/).includes('bg-black'));
    if (pending) {
      assert.doesNotMatch(button, /\bhref=/);
      assert.match(button, /aria-disabled="true"/);
      assert.match(button, /aria-busy="true"/);
    } else {
      assert.ok(button.includes(`href="${appLink.url}"`));
      assert.doesNotMatch(button, /aria-(?:disabled|busy)=/);
    }
  }
});

test('Studio copy stays user-facing and avoids unsupported personal-model promises', async () => {
  const staleInternalPhrases = [
    /technical model by name/i,
    /技术模型名称/,
    /तकनीकी मॉडल का नाम/,
    /modelo técnico por su nombre/i,
    /technischen Modellnamen/i,
    /技術的なモデル名/,
    /технической модели по названию/i,
    /nom de modèle technique/i,
    /اسم نموذج تقني/,
  ];

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    const studioPaths = leafPaths(messages.studio);
    const studioText = studioPaths.map((path) => valueAtPath(messages.studio, path)).join('\n');

    for (const phrase of staleInternalPhrases) {
      assert.doesNotMatch(studioText, phrase, `${locale} Studio copy contains internal model-picker language`);
    }

    for (const path of studioPaths) {
      const value = valueAtPath(messages.studio, path);
      if (/1K/.test(value)) {
        assert.match(path, /^quality\./, `${locale}.studio.${path} makes an unsupported personal-model 1K claim`);
      }
    }
  }
});

test('retired Models URLs redirect directly to localized Studio canonicals', async () => {
  const [redirects, sitemapSource] = await Promise.all([
    readProjectFile('public/_redirects'),
    readProjectFile('src/app/sitemap.ts'),
  ]);

  const redirectLines = redirects.split(/\r?\n/);
  for (const redirect of [
    '/models /studio/ 308',
    '/models/ /studio/ 308',
    '/en/models /studio/ 308',
    '/en/models/ /studio/ 308',
    '/studio /studio/ 308',
    '/en/studio /studio/ 308',
    '/en/studio/ /studio/ 308',
  ]) {
    assert.equal(redirectLines.includes(redirect), true, `missing redirect: ${redirect}`);
  }
  for (const locale of localeCodes.filter((code) => code !== 'en')) {
    for (const source of [`/${locale}/models`, `/${locale}/models/`]) {
      const redirect = `${source} /${locale}/studio/ 308`;
      assert.equal(redirectLines.includes(redirect), true, `missing redirect: ${redirect}`);
    }
  }
  assert.match(sitemapSource, /buildLocalizedUrl\(baseUrl, locale, '\/studio\/'\)/);
  assert.match(sitemapSource, /buildHreflangLanguages\(baseUrl, '\/studio\/', locales\)/);
  assert.doesNotMatch(sitemapSource, /['"]\/models\/['"]/);
  assert.doesNotMatch(sitemapSource, /lastModified:\s*new Date\(\)/);
  assert.doesNotMatch(sitemapSource, /:\s*new Date\(\),/);
});

test('sitemap content entries prefer update timestamps with creation fallbacks', async () => {
  const [sitemapSource, blogInventorySource, useCaseInventorySource] = await Promise.all([
    readProjectFile('src/app/sitemap.ts'),
    readProjectFile('src/lib/blog-static-params.ts'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);

  assert.match(blogInventorySource, /updated_at: updatedAt \|\| null,/);
  assert.match(useCaseInventorySource, /updated_at\?: string;/);
  assert.match(
    sitemapSource,
    /for \(const post of blogPosts\) \{[\s\S]{0,300}const lastModified = post\.updated_at \|\| post\.created_at;[\s\S]{0,500}lastModified: new Date\(lastModified\),/,
  );
  assert.match(
    sitemapSource,
    /for \(const item of useCases\) \{[\s\S]{0,300}const lastModified = item\.updated_at \|\| item\.created_at;[\s\S]{0,500}\.\.\.\(lastModified \? \{ lastModified: new Date\(lastModified\) \} : \{\}\),/,
  );
});

test('blog static generation uses compact revision-aware Cloudflare build caching', async () => {
  const [
    inventorySource,
    cacheSource,
    defaultPostPage,
    localizedPostPage,
    blogHook,
  ] = await Promise.all([
    readProjectFile('src/lib/blog-static-params.ts'),
    readProjectFile('src/lib/blog-post-build-cache.ts'),
    readProjectFile('src/app/blog/[slug]/page.tsx'),
    readProjectFile('src/app/[locale]/blog/[slug]/page.tsx'),
    readProjectFile('src/hooks/useBlog.ts'),
  ]);
  const blogStaticParams = await loadTypeScriptModule('src/lib/blog-static-params.ts', {
    '@/i18n/request': { defaultLocale: 'en' },
  });

  assert.match(inventorySource, /sitemap: '1',[\s\S]{0,120}view: 'landing-static'/);
  assert.match(cacheSource, /\.next', 'cache', 'blog-content'/);
  assert.match(cacheSource, /cached\.revision !== revision/);
  assert.match(cacheSource, /inventoryPost\.updated_at \|\| inventoryPost\.created_at/);
  assert.match(cacheSource, /view: 'landing-static'/);
  assert.match(defaultPostPage, /fetchLandingBlogPost\(/);
  assert.match(localizedPostPage, /fetchLandingBlogPost\(/);
  assert.match(blogHook, /searchParams\.set\('view', 'landing-static'\)/);

  const inventory = [{
    slug: 'portrait-ideas',
    created_at: '2026-01-01T00:00:00.000Z',
    translations: { ja: { slug: 'ポートレート案' } },
  }];
  assert.deepEqual(
    blogStaticParams.resolveBlogRoute(inventory, 'ja', encodeURIComponent('ポートレート案'), ['en', 'ja']),
    {
      post: inventory[0],
      slugMap: { en: 'portrait-ideas', ja: 'ポートレート案' },
    },
  );
  assert.equal(blogStaticParams.resolveBlogRoute(inventory, 'ja', 'missing', ['en', 'ja']), null);
});

test('preset static generation uses validated revision-aware build snapshots', async () => {
  const [presetSource, cacheSource, cacheClearTest] = await Promise.all([
    readProjectFile('src/lib/ai-presets.ts'),
    readProjectFile('src/lib/ai-preset-build-cache.ts'),
    readProjectFile('scripts/clear-next-fetch-cache.test.js'),
  ]);

  assert.match(cacheSource, /\.next', 'cache', 'ai-preset-content'/);
  assert.match(cacheSource, /snapshotRevision\(value\.presets\) === value\.revision/);
  assert.match(cacheSource, /volume: preset\.volume \?\? null/);
  assert.match(cacheSource, /created_at: preset\.created_at \?\? null/);
  assert.match(cacheSource, /has_active_test: preset\.has_active_test === true/);
  assert.match(presetSource, /postPublicSupabaseRpc\('list_ai_presets_for_landing'/);
  assert.match(cacheSource, /age >= 0 && age <= CACHE_MAX_AGE_MS/);
  assert.match(cacheSource, /rename\(temporaryPath, filePath\)/);
  assert.match(presetSource, /for \(const locale of snapshotLocales\)/);
  assert.match(presetSource, /AI preset route inventory for locale/);
  assert.match(presetSource, /storeAiPresetBuildSnapshot\(locale, presets\)/);
  assert.match(presetSource, /readAiPresetBuildSnapshot\(locale\)/);
  assert.match(cacheClearTest, /ai-preset-content/);
});

test('navigation, footer, sitemap, and llms.txt point directly to Studio', async () => {
  const [navigation, footer, sitemap, llmsText] = await Promise.all([
    readProjectFile('src/components/layout/Navigation.tsx'),
    readProjectFile('src/components/layout/Footer.tsx'),
    readProjectFile('src/app/sitemap.ts'),
    readProjectFile('public/llms.txt'),
  ]);

  assert.match(navigation, /t\('studio'\)/);
  assert.match(navigation, /localePath\(locale, '\/studio\/'\)/);
  assert.match(footer, /tNav\('studio'\)/);
  assert.match(footer, /localePath\(locale, '\/studio\/'\)/);
  assert.match(sitemap, /'\/studio\/'/);
  assert.match(
    llmsText,
    /^- \[Studio – Custom AI Photo Creation\]\(https:\/\/myaiphotoshoot\.com\/studio\/\)$/m,
  );

  for (const [name, source] of Object.entries({ navigation, footer, sitemap, llmsText })) {
    assert.doesNotMatch(source, /\/models\//, `${name} still links to /models/`);
  }
});

test('footer links directly to the canonical English-only legal documents', async () => {
  const footer = await readProjectFile('src/components/layout/Footer.tsx');

  assert.match(footer, /href="\/legal\/"/);
  assert.match(footer, /href="\/license\/"/);
  assert.match(footer, /t\('legal'\)/);
  assert.match(footer, /t\('imageLicense'\)/);
  assert.doesNotMatch(footer, /localePath\(locale, '\/legal\/'\)/);
  assert.doesNotMatch(footer, /localePath\(locale, '\/license\/'\)/);
});

test('preset infinite loading keeps a crawlable next-page fallback', async () => {
  const [presetsGrid, defaultPaginatedRoute] = await Promise.all([
    readProjectFile('src/components/presets/AiPresetsGrid.tsx'),
    readProjectFile('src/app/ai-presets/browse/[pageNumber]/page.tsx'),
  ]);

  assert.match(presetsGrid, /aiPresetsPagePath\(page \+ 1\)/);
  assert.match(presetsGrid, /href=\{nextPageHref\}/);
  assert.match(presetsGrid, /rel="next"/);
  assert.match(defaultPaginatedRoute, /<NextIntlClientProvider locale=\{defaultLocale\} messages=\{messages\}>/);
});

test('preset sorting and pagination use the static deployment catalog', async () => {
  const [presetsGrid, catalogRoute, headers] = await Promise.all([
    readProjectFile('src/components/presets/AiPresetsGrid.tsx'),
    readProjectFile('src/app/preset-catalog/[locale]/route.ts'),
    readProjectFile('public/_headers'),
  ]);

  assert.match(presetsGrid, /fetch\(aiPresetCatalogPath\(locale\)\)/);
  assert.match(presetsGrid, /sortAiPresetCatalog\(catalog, sort\)/);
  assert.doesNotMatch(presetsGrid, /postPublicSupabaseRpc|list_ai_presets/);
  assert.match(catalogRoute, /fetchAiPresetCatalog\(locale\)/);
  assert.match(catalogRoute, /locales\.map\(\(locale\) => \(\{ locale \}\)\)/);
  assert.match(headers, /^\/preset-catalog\/\*[\s\S]*?X-Robots-Tag: noindex, follow/m);
});

test('preset catalog validation preserves popular order and sorts newest deterministically', async () => {
  const catalogModule = await loadTypeScriptModule('src/lib/ai-preset-catalog.ts');
  const catalog = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      slug: 'popular-first',
      name: 'Popular first',
      featured_graphics: null,
      featured_graphics_alt: null,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      slug: 'newest',
      name: 'Newest',
      featured_graphics: 'https://cdn.myaiphotoshoot.com/newest.jpg',
      featured_graphics_alt: 'Newest preset',
      created_at: '2026-02-01T00:00:00.000Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      slug: 'newest-tie-breaker',
      name: 'Newest tie breaker',
      featured_graphics: null,
      featured_graphics_alt: null,
      created_at: '2026-02-01T00:00:00.000Z',
    },
  ];

  assert.deepEqual(catalogModule.parseAiPresetCatalog(catalog), catalog);
  for (const has_active_test of [true, false]) {
    const withFlags = catalog.map((preset) => ({ ...preset, has_active_test }));
    assert.deepEqual(catalogModule.parseAiPresetCatalog(withFlags), withFlags);
  }
  assert.throws(() => catalogModule.parseAiPresetCatalog([
    { ...catalog[0], has_active_test: 'false' },
  ]), /invalid data/);
  assert.deepEqual(
    catalogModule.sortAiPresetCatalog(catalog, 'popular').map((preset) => preset.slug),
    ['popular-first', 'newest', 'newest-tie-breaker'],
  );
  assert.deepEqual(
    catalogModule.sortAiPresetCatalog(catalog, 'new').map((preset) => preset.slug),
    ['newest-tie-breaker', 'newest', 'popular-first'],
  );
  assert.equal(catalogModule.aiPresetCatalogPath('en'), '/preset-catalog/en');
  assert.throws(
    () => catalogModule.parseAiPresetCatalog([...catalog, catalog[0]]),
    /duplicate routes/,
  );
});

test('preset lists and detail buttons omit credit prices', async () => {
  const [presetsIndex, homePresets, presetPage, presetExperiment] = await Promise.all([
    readProjectFile('src/components/presets/AiPresetsIndex.tsx'),
    readProjectFile('src/components/features/HomePresets.tsx'),
    readProjectFile('src/components/presets/AiPresetPage.tsx'),
    readProjectFile('src/components/presets/PresetExperiment.tsx'),
  ]);

  for (const source of [presetsIndex, homePresets, presetPage, presetExperiment]) {
    assert.doesNotMatch(source, /formatCredits|PresetExperimentPrice|\bCR\b/);
  }
  assert.doesNotMatch(presetPage, />\s*\d+\s+CR\s*</);
  assert.doesNotMatch(presetExperiment, />\s*\d+\s+CR\s*</);
});

test('homepage preset cards open detail pages while detail CTAs open the app in the current tab', async () => {
  const [homePresets, presetPage] = await Promise.all([
    readProjectFile('src/components/features/HomePresets.tsx'),
    readProjectFile('src/components/presets/AiPresetPage.tsx'),
  ]);
  /** @type {string | undefined} */
  const presetCard = homePresets
    .match(/<Link\b[^>]*>/g)
    ?.find((candidate) => candidate.includes('href={localePath(locale, `/presets/${preset.slug}/`)}'));
  /** @type {string[]} */
  const presetLinks = Array.from(
    presetPage.matchAll(/<PresetExperimentLink\b[^>]*>/g),
    (match) => match[0],
  ).filter((candidate) => candidate.includes('href={appUrl}'));

  assert.ok(presetCard, 'Missing localized homepage preset detail link');
  assert.doesNotMatch(presetCard, /\btarget=/);
  assert.match(presetCard, /aria-label=\{preset\.name\}/);
  assert.doesNotMatch(homePresets, /href=\{buildPresetAppUrl\(preset\.slug\)\}/);
  assert.equal(presetLinks.length, 3, 'Expected all three preset detail app links');
  for (const presetLink of presetLinks) {
    assert.doesNotMatch(presetLink, /\btarget=/);
  }
  assert.match(homePresets, /href=\{localePath\(locale, '\/presets\/'\)\}/);
});

test('preset detail pages normally receive content and pricing from one RPC and validate route identity', async () => {
  const calls = [];
  const aiPresets = await loadTypeScriptModule('src/lib/ai-presets.ts', {
    './app-links': await loadTypeScriptModule('src/lib/app-links.ts'),
    '@/i18n/request': { defaultLocale: 'en', locales: ['en', 'de'] },
    '@/lib/ai-preset-build-cache': {
      AI_PRESET_REVALIDATE_SECONDS: 3600,
      readAiPresetBuildSnapshot: async () => null,
      storeAiPresetBuildSnapshot: async () => 'written',
    },
    '@/lib/ai-presets-shared': {
      AI_PRESETS_PAGE_SIZE: 12,
      aiPresetsPagePath: (page) => page <= 1 ? '/presets/' : `/ai-presets/browse/${page}/`,
    },
    '@/lib/pricing': { CREDIT_USD_REFERENCE_VALUE: 0.03 },
    '@/lib/public-supabase': {
      postPublicSupabaseRpc: async (...args) => {
        calls.push(args);
        if (args[1].p_slug === 'missing') {
          return new Response('[]');
        }
        if (args[0] === 'get_ai_preset') {
          if (args[1].p_max_input_photos) {
            return new Response('Missing RPC signature', { status: 404 });
          }
          return new Response(JSON.stringify([{
            id: 'preset-id',
            slug: args[1].p_identifier,
            name: 'Legacy preset',
            cost_credits: 3,
          }]));
        }
        const requestedSlug = args[1].p_slug;
        return new Response(JSON.stringify([{
          id: 'preset-id',
          slug: requestedSlug === 'wrong-slug' ? 'golden-hour' : requestedSlug,
          name: 'Goldene Stunde',
          cost_credits: requestedSlug === 'legacy-preset' ? undefined : 3,
        }]));
      },
    },
    '@/lib/seo': {},
  });

  const preset = await aiPresets.fetchAiPreset('golden-hour', 'de');

  assert.equal(preset?.name, 'Goldene Stunde');
  assert.equal(preset?.cost_credits, 3);
  assert.equal((await aiPresets.fetchAiPreset('legacy-preset', 'de'))?.cost_credits, 3);
  assert.equal(await aiPresets.fetchAiPreset('missing', 'de'), undefined);
  await assert.rejects(
    aiPresets.fetchAiPreset('wrong-slug', 'de'),
    /Failed to fetch AI preset "wrong-slug" for locale "de"/,
  );
  assert.deepEqual(calls, [
    ['get_ai_preset_page', { p_slug: 'golden-hour', p_locale: 'de' }, 3600],
    ['get_ai_preset_page', { p_slug: 'legacy-preset', p_locale: 'de' }, 3600],
    ['get_ai_preset', {
      p_identifier: 'legacy-preset',
      p_locale: 'de',
      p_max_input_photos: 14,
    }, 3600],
    ['get_ai_preset', { p_identifier: 'legacy-preset', p_locale: 'de' }, 3600],
    ['get_ai_preset_page', { p_slug: 'missing', p_locale: 'de' }, 3600],
    ['get_ai_preset_page', { p_slug: 'wrong-slug', p_locale: 'de' }, 3600],
  ]);
});

async function loadPresetCatalogApi(postPublicSupabaseRpc) {
  return loadTypeScriptModule('src/lib/ai-presets.ts', {
    './app-links': await loadTypeScriptModule('src/lib/app-links.ts'),
    '@/i18n/request': { defaultLocale: 'en', locales: ['en', 'de'] },
    '@/lib/ai-preset-build-cache': {
      AI_PRESET_REVALIDATE_SECONDS: 3600,
      readAiPresetBuildSnapshot: async () => null,
      storeAiPresetBuildSnapshot: async () => 'written',
    },
    '@/lib/ai-presets-shared': { AI_PRESETS_PAGE_SIZE: 12 },
    '@/lib/pricing': { CREDIT_USD_REFERENCE_VALUE: 0.03 },
    '@/lib/public-supabase': { postPublicSupabaseRpc },
    '@/lib/seo': {},
  });
}

test('landing catalog preserves test flags and multi-photo capability across locales', async () => {
  const calls = [];
  const api = await loadPresetCatalogApi(async (...args) => {
    calls.push(args);
    return Response.json([true, false].map((has_active_test, index) => ({
      id: `preset-${index}`, slug: `preset-${index}`, name: `Preset ${index}`,
      created_at: '2026-09-26T00:00:00Z', total_count: 2,
      min_input_photos: 1, max_input_photos: 2, has_active_test,
    })));
  });
  const catalog = await api.fetchAiPresetCatalog('de');
  assert.deepEqual(catalog.map((preset) => preset.has_active_test), [true, false]);
  assert.equal(calls.length, 2);
  for (const [index, args] of calls.entries()) {
    assert.deepEqual(args, ['list_ai_presets_for_landing', {
      p_locale: ['en', 'de'][index], p_limit: 100, p_offset: 0, p_max_input_photos: 14,
    }, 3600]);
  }
});

test('landing build rejects failed RPCs and missing test flags without a legacy retry', async () => {
  for (const response of [
    new Response('Unavailable', { status: 500 }),
    new Response('Missing RPC', { status: 404 }),
    Response.json([{ id: 'preset', slug: 'preset', name: 'Preset', total_count: 1 }]),
    Response.json([{ id: 'preset', slug: 'preset', name: 'Preset', total_count: 1, has_active_test: 'false' }]),
  ]) {
    let calls = 0;
    const api = await loadPresetCatalogApi(async () => { calls++; return response; });
    await assert.rejects(api.fetchAiPresetsPageStrict('en'), (error) => {
      assert.match(error.cause.message, response.ok ? /valid test flags/ : /Landing preset RPC returned/);
      if (response.status === 404) assert.match(error.cause.message, /migration before building/);
      return true;
    });
    assert.equal(calls, 1, 'failure must not retry without multi-photo capability');
  }
});

test('mask catalogs request current KMP pricing and preserve the returned credit cost', async () => {
  const pricing = await loadPricingModule();
  for (const price of [2, 5]) {
    const requests = [];
    const masks = await loadTypeScriptModule('src/lib/ai-masks.ts', {
      '@/i18n/request': { defaultLocale: 'en' },
      '@/lib/pricing': pricing,
      '@/lib/public-supabase': {
        postPublicSupabaseRpc: async (name, body) => {
          requests.push({ name, body });
          return Response.json(name === 'list_ai_mask_categories' ? [{
            id: 'category', slug: 'hairstyles', name: 'Hairstyles',
            source_image_url: '/before.webp', audience_gender: 'unisex', sort_order: 0,
          }] : [{
            id: 'mask', category_id: 'category', slug: 'bob', name: 'Bob',
            featured_graphics: '/after.webp', price_credits: price, price_usd: 0.09, sort_order: 0,
          }]);
        },
      },
    });
    const catalog = await masks.fetchMasksCatalogStrict('de');
    assert.deepEqual(requests.filter(({ name }) => name === 'list_ai_masks'), [{
      name: 'list_ai_masks',
      body: { p_locale: 'de', p_platform: 'web', p_app_version: '1.13.0' },
    }]);
    assert.equal(catalog.masks[0].priceCredits, price);
  }
});

test('a missing versioned mask catalog fails without retrying legacy prices', async () => {
  const requests = [];
  const masks = await loadTypeScriptModule('src/lib/ai-masks.ts', {
    '@/i18n/request': { defaultLocale: 'en' },
    '@/lib/pricing': await loadPricingModule(),
    '@/lib/public-supabase': {
      postPublicSupabaseRpc: async (name, body) => {
        requests.push({ name, body });
        return name === 'list_ai_mask_categories'
          ? Response.json([])
          : Response.json({ code: 'PGRST202' }, { status: 404 });
      },
    },
  });
  await assert.rejects(masks.fetchMasksCatalogStrict('en'), /Failed to fetch the AI mask catalog/);
  assert.deepEqual(requests.filter(({ name }) => name === 'list_ai_masks'), [{
    name: 'list_ai_masks',
    body: { p_locale: 'en', p_platform: 'web', p_app_version: '1.13.0' },
  }]);
});

test('mask catalog schema models masks as collection items rather than software apps', async () => {
  const masksCatalog = await readProjectFile('src/components/masks/AiMasksCatalog.tsx');

  assert.match(masksCatalog, /item:\s*\{\s*'@type': 'Thing'/);
  assert.doesNotMatch(masksCatalog, /'@type': 'SoftwareApplication'/);
  assert.doesNotMatch(masksCatalog, /applicationCategory:/);
  assert.doesNotMatch(masksCatalog, /operatingSystem:/);
});

test('localized page and social metadata stays concise, translated, and evergreen', async () => {
  /** @type {typeof import('../messages/en/index.json')} */
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    const { home, useCases } = messages.pageCopy;
    assert.equal(
      Boolean(messages.studio?.meta) && typeof messages.studio.meta === 'object',
      true,
      `${locale}.studio.meta is missing`,
    );
    const studioMeta = messages.studio.meta;

    assert.ok([...home.metaTitle].length <= 60, `${locale} home meta title is too long`);
    assert.ok([...home.metaDescription].length <= 160, `${locale} home meta description is too long`);
    assert.ok([...home.shareTitle].length <= 60, `${locale} home share title is too long`);
    assert.ok([...home.shareDescription].length <= 160, `${locale} home share description is too long`);
    assert.ok(
      [...`${studioMeta.title} | My AI Photoshoot`].length <= 60,
      `${locale} rendered Studio meta title is too long`,
    );
    assert.ok([...studioMeta.description].length <= 160, `${locale} Studio meta description is too long`);
    assert.ok([...studioMeta.shareTitle].length <= 60, `${locale} Studio share title is too long`);
    assert.ok([...studioMeta.shareDescription].length <= 160, `${locale} Studio share description is too long`);
    assert.ok([...studioMeta.imageAlt].length <= 160, `${locale} Studio image alt is too long`);
    assert.doesNotMatch(home.shareTitle, commercialShareClaim, `${locale} home share title is commercial`);
    assert.doesNotMatch(home.shareDescription, commercialShareClaim, `${locale} home share description is commercial`);
    assert.doesNotMatch(studioMeta.shareTitle, commercialShareClaim, `${locale} Studio share title is commercial`);
    assert.doesNotMatch(studioMeta.shareDescription, commercialShareClaim, `${locale} Studio share description is commercial`);
    assert.ok(
      [...`${useCases.metaTitle} | My AI Photoshoot`].length <= 60,
      `${locale} use-cases meta title is too long`,
    );
    assert.ok(
      [...useCases.metaDescription].length <= 160,
      `${locale} use-cases meta description is too long`,
    );

    if (locale !== 'en') {
      assert.notEqual(
        home.metaDescription,
        english.pageCopy.home.metaDescription,
        `${locale} home meta description is still English`,
      );
      assert.notEqual(
        home.shareDescription,
        english.pageCopy.home.shareDescription,
        `${locale} home share description is still English`,
      );
      assert.notEqual(
        studioMeta.description,
        english.studio.meta.description,
        `${locale} Studio meta description is still English`,
      );
      assert.notEqual(
        studioMeta.shareDescription,
        english.studio.meta.shareDescription,
        `${locale} Studio share description is still English`,
      );
      assert.notEqual(
        studioMeta.imageAlt,
        english.studio.meta.imageAlt,
        `${locale} Studio image alt is still English`,
      );
      assert.notEqual(
        useCases.metaDescription,
        english.pageCopy.useCases.metaDescription,
        `${locale} use-cases meta description is still English`,
      );
    }
  }

  assert.equal(english.pageCopy.home.shareTitle, englishShareTitle);
  assert.equal(english.pageCopy.home.shareDescription, englishShareDescription);
});

test('social metadata uses dedicated evergreen copy without changing page SEO copy', async () => {
  const [
    rootLayout,
    rootHome,
    localizedHome,
    homeSeo,
    rootStudio,
    localizedStudio,
    useCaseSeo,
  ] = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/lib/seo.ts'),
    readProjectFile('src/app/studio/page.tsx'),
    readProjectFile('src/app/[locale]/studio/page.tsx'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);

  assert.match(homeSeo, new RegExp(englishShareTitle));
  assert.match(
    homeSeo,
    new RegExp(englishShareDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.equal((rootLayout.match(/HOME_METADATA_DEFAULTS\.shareTitle/g) || []).length, 2);
  assert.equal((rootLayout.match(/HOME_METADATA_DEFAULTS\.shareDescription/g) || []).length, 2);
  for (const source of [rootHome, localizedHome]) {
    assert.equal((source.match(/title: shareTitle/g) || []).length, 2);
    assert.equal((source.match(/description: shareDescription/g) || []).length, 2);
  }
  for (const source of [rootStudio, localizedStudio]) {
    assert.equal((source.match(/title: shareTitle/g) || []).length, 2);
    assert.equal((source.match(/description: shareDescription/g) || []).length, 2);
    assert.match(source, /namespace: 'studio\.meta'/);
    assert.match(source, /buildAlternates\([^\n]+, '\/studio\/', locales\)/);
    assert.match(source, /canonicalUrl\([^\n]+, '\/studio\/'\)/);
    assert.match(source, /const imageAlt = t\('imageAlt'\)/);
    assert.equal((source.match(/url: '\/og-image-v2\.jpg\?v=8'/g) || []).length, 2);
    assert.equal((source.match(/alt: imageAlt/g) || []).length, 2);
    assert.doesNotMatch(source, /og-models|\/models\//);
  }

  assert.match(useCaseSeo, /const socialDescription = buildUseCaseSocialDescription\(/);
  assert.equal((useCaseSeo.match(/description: socialDescription/g) || []).length, 2);
});

test('the retired Models route and generated page component are absent', async () => {
  for (const relativePath of [
    'src/app/models/page.tsx',
    'src/app/models/layout.tsx',
    'src/app/[locale]/models/page.tsx',
    'src/components/models/ModelsPage.tsx',
  ]) {
    await assert.rejects(
      access(path.join(projectRoot, relativePath)),
      (error) => error?.code === 'ENOENT',
      `${relativePath} still exists`,
    );
  }
});

test('active copy and SEO do not revive the retired cash-per-image story', async () => {
  const targetedPaths = [
    'useCase.fallbackDescription',
    'useCase.cta.primary',
  ];
  const staleClaim = /(?:no monthly plan|no subscription required|\$0\.(?:03|09|19|29)|train(?:ing)? (?:once )?from \$)/i;

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const dottedPath of targetedPaths) {
      const value = valueAtPath(messages, dottedPath);
      assert.doesNotMatch(String(value || ''), staleClaim, `${locale} has stale copy at ${dottedPath}`);
    }
  }

  const pricingUi = await readProjectFile('src/components/features/PricingPlans.tsx');
  assert.match(pricingUi, /fetch\(`\/pricing\?\$\{params\.toString\(\)\}`/);
  assert.match(pricingUi, /cache: 'no-store'/);

  const structuredDataSources = await Promise.all([
    readProjectFile('src/components/seo/HomeJsonLd.tsx'),
    readProjectFile('src/components/seo/UseCaseProductJsonLd.tsx'),
    readProjectFile('src/lib/product-offer.ts'),
  ]);
  const [homeStructuredData, useCaseStructuredData] = structuredDataSources;
  const structuredData = structuredDataSources.join('\n');
  assert.match(structuredData, /OfferCatalog/);
  assert.doesNotMatch(structuredData, /AggregateOffer|shippingDetails|MerchantReturnNotPermitted/);
  assert.match(homeStructuredData, /namespace: 'pageCopy\.home'/);
  assert.match(homeStructuredData, /namespace: 'pricing'/);
  assert.match(homeStructuredData, /namespace: 'useCase\.schema'/);
  assert.doesNotMatch(homeStructuredData, /serviceType: 'AI photo/);
  assert.match(homeStructuredData, /serviceType: tSchema\('serviceType'\)/);
  assert.match(useCaseStructuredData, /t\('schema\.serviceType'\)/);
  assert.doesNotMatch(structuredData, /plans\.(?:pro|max)|name: '(?:Pro|Max)'/);

  const metadataSources = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/lib/ai-presets.ts'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);
  assert.doesNotMatch(metadataSources.join('\n'), /\/og-image\.png/);
});

test('pricing displays every offer, KMP photo estimates, and savings without purchase controls', async () => {
  const pricing = await loadPricingModule();
  const text = (html) => html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&');

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    /** @type {(key: string, values?: import('next-intl').TranslationValues) => string} */
    const t = createTranslator({
      locale,
      messages,
      namespace: 'pricing',
      onError: (error) => { throw error; },
    });
    const { default: PricingOfferList } = await loadTypeScriptModule(
      'src/components/features/PricingOfferList.tsx',
      {
        '@/lib/pricing': pricing,
        '@/lib/utils': {
          useTranslations: () => t,
          cn: (...classes) => classes.filter(Boolean).join(' '),
        },
      },
    );
    const subscription = renderToStaticMarkup(createElement(PricingOfferList, {
      kind: 'subscription',
      pricing: pricing.US_REFERENCE_PRICING,
      locale,
    }));
    const packs = renderToStaticMarkup(createElement(PricingOfferList, {
      kind: 'packs',
      pricing: pricing.US_REFERENCE_PRICING,
      locale,
    }));
    const subscriptionText = text(subscription);
    const number = new Intl.NumberFormat(locale);
    assert.ok(subscriptionText.includes(t('subscription.expiry')), locale);
    assert.ok(subscriptionText.includes(t('subscription.cancel')), locale);
    for (const price of [29.99, 2.99]) {
      assert.ok(subscriptionText.includes(pricing.formatCurrency(price, 'USD', locale)), locale);
    }
    const annualPrice = subscription.match(/<dd\b[^>]*>(.*?)<\/dd>/s)?.[1];
    assert.ok(annualPrice, locale);
    assert.equal(text(annualPrice.match(/<bdi>(.*?)<\/bdi>/s)?.[1] ?? ''), t('billing.weeklyPrice', {
      price: pricing.formatCurrency(29.99 / 52, 'USD', locale),
    }), locale);
    assert.ok(text(annualPrice).includes(t('billing.annualCharge', {
      price: pricing.formatCurrency(29.99, 'USD', locale),
    })), locale);
    assert.ok(subscriptionText.includes(t('billing.annualSavings', { percent: number.format(81) })), locale);
    assert.ok(subscriptionText.includes(t('weeklyPhotoEstimate', { photos: number.format(10) })), locale);
    assert.ok(subscriptionText.includes(t('billing.weeklyCredits', { credits: number.format(40) })), locale);
    const packText = text(packs);
    assert.ok(packText.includes(t('packs.expiry')), locale);
    for (const [credits, price, photos] of [[10, 0.99, 2], [100, 5.99, 25], [500, 14.99, 125]]) {
      assert.ok(packText.includes(t('creditAmount', { credits: number.format(credits) })), locale);
      assert.ok(packText.includes(pricing.formatCurrency(price, 'USD', locale)), locale);
      assert.ok(packText.includes(t('photoEstimate', { photos: number.format(photos) })), locale);
    }
    for (const percent of [39, 70]) {
      assert.ok(packText.includes(t('packs.savings', { percent: number.format(percent) })), locale);
    }
    assert.doesNotMatch(subscription + packs, /<(?:a|button|input|select|form)\b/, locale);
  }
});

test('Service structured data excludes properties unsupported by the Service type', async () => {
  const serviceSchemaSources = {
    home: await readProjectFile('src/components/seo/HomeJsonLd.tsx'),
    useCase: await readProjectFile('src/components/seo/UseCaseProductJsonLd.tsx'),
  };

  for (const [name, source] of Object.entries(serviceSchemaSources)) {
    assert.match(source, /'@type': 'Service'/, `${name} is no longer Service structured data`);
    assert.doesNotMatch(source, /inLanguage:/, `${name} Service includes unsupported inLanguage`);
  }
});

test('blog metadata descriptions stay concise without cutting natural endings', async () => {
  const { buildMetaDescription } = await loadTypeScriptModule('src/lib/seo.ts');
  const sentence = 'Create polished AI portraits with practical pose, lighting, styling, composition, and expression guidance for consistently professional results.';
  const longDescription = `${sentence} ${'Additional detail '.repeat(12)}`;

  assert.equal(buildMetaDescription(longDescription, 'Fallback'), sentence);
  assert.equal(buildMetaDescription('  Useful   summary  ', 'Fallback'), 'Useful summary');
  assert.equal(buildMetaDescription(null, 'Fallback title'), 'Fallback title');

  const cjkDescription = '写真'.repeat(100);
  const conciseCjk = buildMetaDescription(cjkDescription, 'Fallback');
  assert.equal(Array.from(conciseCjk).length, 160);
  assert.equal(conciseCjk.endsWith('…'), true);
});

test('the social card is cache-busted, correctly sized, and replaces the stale alias', async () => {
  const socialCardPath = path.join(projectRoot, 'public/og-image-v2.jpg');
  const currentPngPath = path.join(projectRoot, 'public/og-image-v2.png');
  const legacyPath = path.join(projectRoot, 'public/og-image.png');
  const [socialCardMetadata, currentPng, legacyPng] = await Promise.all([
    sharp(socialCardPath).metadata(),
    readFile(currentPngPath),
    readFile(legacyPath),
  ]);

  assert.equal(socialCardMetadata.width, 1200);
  assert.equal(socialCardMetadata.height, 630);
  assert.equal(socialCardMetadata.format, 'jpeg');
  assert.deepEqual(legacyPng, currentPng);

  const genericCardSources = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/app/studio/page.tsx'),
    readProjectFile('src/app/[locale]/studio/page.tsx'),
    readProjectFile('src/app/presets/page.tsx'),
    readProjectFile('src/app/[locale]/presets/page.tsx'),
    readProjectFile('src/app/use-cases/page.tsx'),
    readProjectFile('src/app/[locale]/use-cases/page.tsx'),
    readProjectFile('src/app/blog/page.tsx'),
    readProjectFile('src/app/[locale]/blog/page.tsx'),
    readProjectFile('src/app/blog/[slug]/page.tsx'),
    readProjectFile('src/app/[locale]/blog/[slug]/page.tsx'),
    readProjectFile('src/components/seo/HomeJsonLd.tsx'),
    readProjectFile('src/lib/ai-presets.ts'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);
  const genericCardReferences = Array.from(
    genericCardSources.join('\n').matchAll(/(?:https:\/\/myaiphotoshoot\.com)?\/og-image-v2\.jpg(?:\?v=8)?/g),
    (match) => match[0],
  );
  assert.ok(genericCardReferences.length > 0);
  assert.equal(
    genericCardReferences.every((reference) => reference.endsWith('?v=8')),
    true,
    'generic social-card references must use the v8 cache key',
  );

  const completeSocialMetadataSources = {
    support: await readProjectFile('src/app/support/page.tsx'),
    localizedSupport: await readProjectFile('src/app/[locale]/support/page.tsx'),
    paginatedPresets: await readProjectFile('src/app/ai-presets/browse/[pageNumber]/page.tsx'),
    localizedPaginatedPresets: await readProjectFile('src/app/[locale]/ai-presets/browse/[pageNumber]/page.tsx'),
    legal: await readProjectFile('src/app/legal/page.tsx'),
    license: await readProjectFile('src/app/license/page.tsx'),
  };
  for (const [name, source] of Object.entries(completeSocialMetadataSources)) {
    const imageReferences = source.match(/\/og-image-v2\.jpg\?v=8/g) || [];
    assert.equal(imageReferences.length, 2, `${name} must define Open Graph and Twitter images`);
  }
});

test('legacy USD catalog fields round up to the canonical credit cost', async () => {
  const [presetSource, maskSource] = await Promise.all([
    readProjectFile('src/lib/ai-presets.ts'),
    readProjectFile('src/lib/ai-masks.ts'),
  ]);

  for (const source of [presetSource, maskSource]) {
    assert.match(source, /Math\.ceil\([^)]*\/ CREDIT_USD_REFERENCE_VALUE\)/);
    assert.doesNotMatch(source, /Math\.round\([^)]*\/ CREDIT_USD_REFERENCE_VALUE\)/);
  }
});
