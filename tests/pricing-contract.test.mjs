import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const localeCodes = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];
const englishShareTitle = 'Create and Transform AI Photos';
const englishShareDescription = 'Create and transform AI photos with presets, AI Masks, Studio, and custom prompts for headshots, profile photos, portraits, and creative photos.';
const commercialShareClaim = /(?:[$€£¥₹₽]\s*\d|\d+\s*cr\b|\b(?:credits?|pro|max|subscriptions?|subs?|pay[\s-]*as[\s-]*you[\s-]*go|plans?|pricing|prices?|resolution|[1248]k)\b|cr[eé]dit(?:s|os)?|kredit(?:e|en|s)?|abonnement|suscripci[oó]n|forfait|tarif|кредит|подписк|тариф|积分|订阅|套餐|クレジット|サブスクリプション|プラン|क्रेडिट|सदस्यता|प्लान|أرصدة|رصيد|اشتراك|خطة|الدقة|auflösung|r[ée]solution|resoluci[oó]n|разрешени|分辨率|画质|解像度|रिज़ॉल्यूशन)/iu;

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function loadTypeScriptModule(relativePath, dependencies = {}) {
  const source = await readProjectFile(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: path.basename(relativePath),
  }).outputText;
  const module = { exports: {} };
  const evaluate = new Function('exports', 'module', 'require', output);
  const localRequire = (specifier) => dependencies[specifier] ?? require(specifier);
  evaluate(module.exports, module, localRequire);
  return module.exports;
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

test('US reference pricing matches the release catalog', async () => {
  const { CREDIT_COSTS, US_REFERENCE_PRICING } = await loadPricingModule();
  const tiers = Object.fromEntries(US_REFERENCE_PRICING.tiers.map((tier) => [tier.id, tier]));
  const offers = Object.fromEntries(
    US_REFERENCE_PRICING.tiers.flatMap((tier) => tier.offers).map((offer) => [offer.id, offer]),
  );

  assert.equal(US_REFERENCE_PRICING.currency, 'USD');
  assert.equal(US_REFERENCE_PRICING.referenceMarket, 'US');
  assert.equal(US_REFERENCE_PRICING.creditsNeverExpire, true);
  assert.equal(US_REFERENCE_PRICING.trialAvailable, false);
  assert.deepEqual(
    Object.fromEntries(Object.entries(offers).map(([id, offer]) => [
      id,
      [offer.price, offer.credits, offer.creditGrantPeriod],
    ])),
    {
      'payg-200': [5.99, 200, 'oneTime'],
      'payg-300': [8.99, 300, 'oneTime'],
      'pro-annual': [149.9, 200, 'monthly'],
      'pro-monthly': [14.99, 200, 'monthly'],
      'pro-weekly': [6.99, 100, 'weekly'],
      'max-annual': [299.9, 400, 'monthly'],
      'max-monthly': [29.99, 400, 'monthly'],
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(tiers).map(([id, tier]) => [
      id,
      [tier.defaultOfferId, tier.maxResolution, tier.training],
    ])),
    {
      payg: ['payg-200', '1K', null],
      pro: ['pro-annual', '2K', 'standard'],
      max: ['max-annual', '4K', 'full'],
    },
  );
  assert.deepEqual(
    CREDIT_COSTS.map(({ id, minCredits, maxCredits }) => [id, minCredits, maxCredits]),
    [
      ['standardImage', 3, 3],
      ['proImage', 7, 10],
      ['maxImage', 20, 20],
      ['personalModelImage', 2, 2],
      ['standardTraining', 150, 150],
      ['fullTraining', 300, 300],
    ],
  );
  assert.equal(Math.round((1 - offers['pro-annual'].price / (offers['pro-monthly'].price * 12)) * 100), 17);
  assert.equal(Math.round((1 - offers['max-annual'].price / (offers['max-monthly'].price * 12)) * 100), 17);
  assert.equal('monthlyEquivalentUsd' in offers['pro-annual'], false);
  assert.equal('monthlyEquivalentUsd' in offers['max-annual'], false);
});

test('the Studio page derives quality bands from canonical pricing', async () => {
  const pricing = await loadPricingModule();
  const models = await loadModelsModule(pricing);
  const costs = Object.fromEntries(pricing.CREDIT_COSTS.map((cost) => [cost.id, cost]));
  const tiers = Object.fromEntries(
    pricing.US_REFERENCE_PRICING.tiers.map((tier) => [tier.id, tier]),
  );

  assert.deepEqual(models.qualityBands, [
    {
      id: 'payg',
      minCredits: costs.standardImage.minCredits,
      maxCredits: costs.standardImage.maxCredits,
      maxResolution: tiers.payg.maxResolution,
    },
    {
      id: 'pro',
      minCredits: costs.proImage.minCredits,
      maxCredits: costs.proImage.maxCredits,
      maxResolution: tiers.pro.maxResolution,
    },
    {
      id: 'max',
      minCredits: costs.maxImage.minCredits,
      maxCredits: costs.maxImage.maxCredits,
      maxResolution: tiers.max.maxResolution,
    },
  ]);
  assert.deepEqual(models.personalModelCosts, {
    imageCredits: costs.personalModelImage.minCredits,
    standardTrainingCredits: costs.standardTraining.minCredits,
    fullTrainingCredits: costs.fullTraining.minCredits,
  });
  assert.equal(models.formatCreditRange(3, 3, 'en'), '3');
  assert.equal(models.formatCreditRange(7, 10, 'en'), '7–10');

  const modelsSource = await readProjectFile('src/lib/models.ts');
  assert.match(modelsSource, /CREDIT_COSTS/);
  assert.match(modelsSource, /US_REFERENCE_PRICING/);
  assert.doesNotMatch(modelsSource, /supportedModels|providerModel|providerUrl/);
});

test('regional pricing replaces the complete catalog atomically', async () => {
  const { pricingCatalogFromApi } = await loadTypeScriptModule('src/lib/regional-pricing.ts');
  const response = {
    country_code: 'TH',
    country_group: 'C',
    adaptive_pricing: true,
    packages: [
      { product_id: 'package_30', included_credits: 30, value: 33, currency: 'THB' },
      { product_id: 'package_100', included_credits: 100, value: 100, currency: 'THB' },
    ],
    plans: [
      { product_id: 'pro', base_plan_id: 'weekly', included_credits: 40, value: 100, currency: 'THB' },
      { product_id: 'pro', base_plan_id: 'monthly', included_credits: 75, value: 167, currency: 'THB' },
      { product_id: 'pro', base_plan_id: 'annual', included_credits: 75, value: 1670, currency: 'THB' },
      { product_id: 'max', base_plan_id: 'monthly', included_credits: 150, value: 334, currency: 'THB' },
      { product_id: 'max', base_plan_id: 'annual', included_credits: 150, value: 3343, currency: 'THB' },
    ],
  };

  const catalog = pricingCatalogFromApi(response);
  assert.ok(catalog);
  assert.equal(catalog.referenceMarket, 'TH');
  assert.equal(catalog.countryGroup, 'C');
  assert.equal(catalog.currency, 'THB');
  assert.deepEqual(
    catalog.tiers[0].offers.map((offer) => [offer.id, offer.price, offer.credits]),
    [
      ['payg-30', 33, 30],
      ['payg-100', 100, 100],
    ],
  );
  assert.equal(catalog.tiers[0].defaultOfferId, 'payg-30');
  assert.deepEqual(
    catalog.tiers[1].offers.map((offer) => offer.id),
    ['pro-annual', 'pro-monthly', 'pro-weekly'],
  );
  assert.equal(catalog.tiers[1].offers[0].annualSavingsPercent, 17);

  const indiaResponse = structuredClone(response);
  indiaResponse.country_code = 'IN';
  indiaResponse.country_group = 'B';
  indiaResponse.packages = [
    { product_id: 'package_100', included_credits: 100, value: 2.99, currency: 'USD' },
    { product_id: 'package_200', included_credits: 200, value: 5.99, currency: 'USD' },
  ];
  indiaResponse.plans = [
    { product_id: 'pro', base_plan_id: 'weekly', included_credits: 75, value: 4.99, currency: 'USD' },
    { product_id: 'pro', base_plan_id: 'monthly', included_credits: 150, value: 9.99, currency: 'USD' },
    { product_id: 'pro', base_plan_id: 'annual', included_credits: 150, value: 99.9, currency: 'USD' },
    { product_id: 'max', base_plan_id: 'monthly', included_credits: 300, value: 19.99, currency: 'USD' },
  ];
  const indiaCatalog = pricingCatalogFromApi(indiaResponse);
  assert.ok(indiaCatalog);
  assert.equal(indiaCatalog.tiers[2].defaultOfferId, 'max-monthly');
  assert.deepEqual(indiaCatalog.tiers[2].offers.map((offer) => offer.id), ['max-monthly']);

  const mixedCurrencyResponse = structuredClone(response);
  mixedCurrencyResponse.plans[0].currency = 'USD';
  assert.equal(pricingCatalogFromApi(mixedCurrencyResponse), null);
  assert.equal(pricingCatalogFromApi({ ...response, packages: [] }), null);

  const additiveResponse = structuredClone(response);
  additiveResponse.packages.push({
    product_id: 'package_500',
    included_credits: 500,
    value: 500,
    currency: 'THB',
  });
  additiveResponse.plans.push({
    product_id: 'pro',
    base_plan_id: 'quarterly',
    included_credits: 75,
    value: 500,
    currency: 'THB',
  });
  assert.ok(pricingCatalogFromApi(additiveResponse));
});

test('the pricing redirect uses country first, locale fallback second, and never caches', async () => {
  const proxyPath = path.join(projectRoot, 'functions/pricing.js');
  const { onRequest, resolvePricingCountry } = await import(pathToFileURL(proxyPath).href);
  assert.equal(resolvePricingCountry('th', 'en'), 'TH');
  assert.equal(resolvePricingCountry('XX', 'hi'), 'IN');
  assert.equal(resolvePricingCountry(undefined, 'zh-Hans'), 'CN');
  assert.equal(resolvePricingCountry(undefined, 'unknown'), 'US');

  const methodResponse = await onRequest({
    request: new Request('https://myaiphotoshoot.com/pricing', { method: 'POST' }),
    env: {},
  });
  assert.equal(methodResponse.status, 405);
  assert.equal(methodResponse.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(methodResponse.headers.get('allow'), 'GET');

  const pricingResponse = await onRequest({
    request: {
      method: 'GET',
      url: 'https://myaiphotoshoot.com/pricing?locale=en',
      cf: { country: 'th' },
    },
    env: {},
  });
  assert.equal(pricingResponse.status, 307);
  assert.equal(pricingResponse.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(
    pricingResponse.headers.get('location'),
    'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1/stripe-pricing?country_code=TH',
  );

  const routes = JSON.parse(await readProjectFile('public/_routes.json'));
  assert.equal(routes.include.includes('/pricing'), true);
  assert.equal(routes.include.includes('/pricing/'), true);
});

test('all locales provide the repositioned copy used by the UI', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));
  const requiredPaths = [
    'hero.description',
    'hero.microcopy',
    'features.easyCustomization.title',
    'features.easyCustomization.description',
    'navigation.skipToContent',
    'navigation.mainNavigation',
    'navigation.openMenu',
    'navigation.closeMenu',
    'navigation.studio',
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
    'pricing.creditsNeverExpire',
    'pricing.noTrial',
    'pricing.billing.units.perYear',
    'pricing.billing.annualTerms',
    'pricing.plans.payg.cta',
    'pricing.plans.pro.cta',
    'pricing.plans.max.cta',
    'pricing.creditGuide.items.fullTraining',
    'faq.pricing.answer',
    'faq.subscriptions.answer',
    'useCase.offerSummary',
    'useCase.galleryDisclaimer',
    'useCase.howItWorks.step1.title',
    'useCase.howItWorks.step1.desc',
    'useCase.howItWorks.step2.title',
    'useCase.howItWorks.step2.desc',
    'useCase.howItWorks.step3.title',
    'useCase.howItWorks.step3.desc',
    'useCase.pricingCard.payg',
    'useCase.pricingCard.description',
    'useCase.pricingCard.pro',
    'useCase.pricingCard.max',
    'useCase.schema.serviceType',
    'useCase.stickyCta.label',
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
    for (const namespace of ['pricing', 'studio', 'pageCopy', 'useCase', 'features']) {
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
    }
    for (const dottedPath of leafPaths(english.studio)) {
      assert.deepEqual(
        placeholders(valueAtPath(messages.studio, dottedPath)),
        placeholders(valueAtPath(english.studio, dottedPath)),
        `${locale}.studio.${dottedPath} placeholders differ from English`,
      );
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
    '<AppShowcase locale={locale}',
    '<Features locale={locale}',
    '<HomePresets locale={locale}',
    '<HomeMasks locale={locale}',
    '<Pricing locale={locale}',
  ].map((token) => homeSource.indexOf(token));
  assert.equal(homeOrder.every((position) => position >= 0), true, 'homepage sections are missing');
  assert.deepEqual(homeOrder, [...homeOrder].sort((a, b) => a - b));

  const studioOrder = [
    "t('steps.eyebrow')",
    "t('starts.eyebrow')",
    "t('autoMode.eyebrow')",
    "t('quality.eyebrow')",
    "t('personal.eyebrow')",
  ].map((token) => studioSource.indexOf(token));
  assert.equal(studioOrder.every((position) => position >= 0), true, 'Studio sections are missing');
  assert.deepEqual(studioOrder, [...studioOrder].sort((a, b) => a - b));
  assert.match(studioSource, /qualityBands\.map\(\(band\) =>/);
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

test('Studio explains Auto Mode and quality without reviving a provider picker or service catalog', async () => {
  const [studioSource, platformButtonsSource] = await Promise.all([
    readProjectFile('src/components/studio/StudioPage.tsx'),
    readProjectFile('src/components/features/PlatformButtons.tsx'),
  ]);

  assert.match(studioSource, /const faqKeys = \['writing', 'autoMode', 'quality', 'personal', 'required'\] as const/);
  assert.match(studioSource, /const faq = faqKeys\.map\(\(key\) => \(\{/);
  assert.match(studioSource, /'@type': 'WebPage'/);
  assert.match(studioSource, /'@type': 'Thing'/);
  assert.match(studioSource, /mainEntity: faq\.map\(\(item\) => \(\{/);
  assert.match(studioSource, /'@type': 'Question'/);
  assert.match(studioSource, /'@type': 'Answer'/);
  assert.match(studioSource, /\{faq\.map\(\(item\) => \(/);
  assert.match(studioSource, /\{item\.question\}/);
  assert.match(studioSource, /\{item\.answer\}/);
  assert.match(studioSource, /t\('autoMode\.control'\)/);
  assert.match(studioSource, /t\('quality\.visual\.faster'\)/);
  assert.match(studioSource, /t\('quality\.visual\.higherQuality'\)/);
  assert.equal((studioSource.match(/qualityBands\.map\(\(band\) =>/g) || []).length, 2);
  assert.match(studioSource, /WEB_APP_STUDIO_URL/);
  assert.match(studioSource, /section: 'studio'/);
  assert.equal((studioSource.match(/<PlatformButtons/g) || []).length, 2);
  assert.equal((studioSource.match(/webAppUrl=\{WEB_APP_STUDIO_URL\}/g) || []).length, 2);
  assert.match(studioSource, /placement: 'hero_cta'/);
  assert.match(studioSource, /placement: 'bottom_cta'/);
  assert.doesNotMatch(studioSource, /PlatformAppLink/);
  assert.doesNotMatch(studioSource, /min-h-screen[^"\n]*\bpt-24\b/);
  assert.doesNotMatch(studioSource, /steps\.jumpLink|href="#how-studio-works"/);

  assert.match(platformButtonsSource, /webAppUrl\?: string/);
  assert.match(platformButtonsSource, /webAppUrl = WEB_APP_IDEAS_URL/);
  assert.match(platformButtonsSource, /const attributedWebAppUrl = useAttributedUrl\(webAppUrl\)/);
  assert.match(platformButtonsSource, /dark:bg-purple-700/);
  assert.doesNotMatch(platformButtonsSource, /dark:bg-black/);
  assert.equal((platformButtonsSource.match(/analyticsParams\);/g) || []).length, 3);

  assert.doesNotMatch(
    studioSource,
    /supportedModels|providerModel|providerUrl|modelsByGroup|modelGroupOrder|orderedModels/,
  );
  assert.doesNotMatch(studioSource, /'@type': '(?:Service|ItemList|FAQPage)'/);
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
  assert.match(sitemapSource, /lastModified:\s*new Date\(post\.created_at\)/);
  assert.match(sitemapSource, /item\.created_at \? \{ lastModified: new Date\(item\.created_at\) \} : \{\}/);
  assert.match(sitemapSource, /lastModified \? \{ lastModified: new Date\(lastModified\) \} : \{\}/);
});

test('navigation, homepage links, footer, sitemap, and llms.txt point directly to Studio', async () => {
  const [navigation, features, footer, pricing, sitemap, llmsText] = await Promise.all([
    readProjectFile('src/components/layout/Navigation.tsx'),
    readProjectFile('src/components/features/Features.tsx'),
    readProjectFile('src/components/layout/Footer.tsx'),
    readProjectFile('src/components/features/Pricing.tsx'),
    readProjectFile('src/app/sitemap.ts'),
    readProjectFile('public/llms.txt'),
  ]);

  assert.match(navigation, /t\('studio'\)/);
  assert.match(navigation, /localePath\(locale, '\/studio\/'\)/);
  assert.match(features, /tNav\('studio'\)/);
  assert.match(features, /localePath\(locale, '\/studio\/'\)/);
  assert.match(footer, /tNav\('studio'\)/);
  assert.match(footer, /localePath\(locale, '\/studio\/'\)/);
  assert.match(pricing, /tNav\('studio'\)/);
  assert.match(pricing, /localePath\(locale, '\/studio\/'\)/);
  assert.match(sitemap, /'\/studio\/'/);
  assert.match(
    llmsText,
    /^- \[Studio – Custom AI Photo Creation\]\(https:\/\/myaiphotoshoot\.com\/studio\/\)$/m,
  );

  for (const [name, source] of Object.entries({ navigation, features, footer, pricing, sitemap, llmsText })) {
    assert.doesNotMatch(source, /\/models\//, `${name} still links to /models/`);
  }
});

test('localized page and social metadata stays concise, translated, and evergreen', async () => {
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
      [...`${studioMeta.title} | My AI Photo Shoot`].length <= 60,
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
      [...`${useCases.metaTitle} | My AI Photo Shoot`].length <= 60,
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
    rootStudio,
    localizedStudio,
    useCaseSeo,
  ] = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/app/studio/page.tsx'),
    readProjectFile('src/app/[locale]/studio/page.tsx'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);

  assert.equal((rootLayout.match(new RegExp(englishShareTitle, 'g')) || []).length, 2);
  assert.equal((rootLayout.match(new RegExp(englishShareDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 2);
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
    assert.equal((source.match(/url: '\/og-image-v2\.jpg\?v=4'/g) || []).length, 2);
    assert.equal((source.match(/alt: imageAlt/g) || []).length, 2);
    assert.doesNotMatch(source, /og-models|\/models\//);
  }

  assert.match(useCaseSeo, /const description = appendPlanSummary\(/);
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
    'hero.microcopy',
    'useCase.offerSummary',
    'useCase.stickyCta.label',
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
  assert.match(pricingUi, /billing\.units\.perYear/);

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
  for (const tier of ['payg', 'pro', 'max']) {
    assert.match(useCaseStructuredData, new RegExp(`t\\('pricingCard\\.${tier}'\\)`));
  }

  const metadataSources = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/lib/ai-presets.ts'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);
  assert.doesNotMatch(metadataSources.join('\n'), /\/og-image\.png/);
});

test('the social card is cache-busted, correctly sized, and replaces the stale alias', async () => {
  const currentPath = path.join(projectRoot, 'public/og-image-v2.png');
  const legacyPath = path.join(projectRoot, 'public/og-image.png');
  const [metadata, currentImage, legacyImage] = await Promise.all([
    sharp(currentPath).metadata(),
    readFile(currentPath),
    readFile(legacyPath),
  ]);

  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.deepEqual(legacyImage, currentImage);

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
  const genericCardReferences = genericCardSources.join('\n').match(/(?:https:\/\/myaiphotoshoot\.com)?\/og-image-v2\.jpg(?:\?v=4)?/g) || [];
  assert.ok(genericCardReferences.length > 0);
  assert.equal(
    genericCardReferences.every((reference) => reference.endsWith('?v=4')),
    true,
    'generic social-card references must use the v4 cache key',
  );
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
