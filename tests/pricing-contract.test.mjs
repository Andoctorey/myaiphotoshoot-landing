import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const localeCodes = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];
const englishShareTitle = 'AI Photos That Still Look Like You';
const englishShareDescription = 'Create realistic AI photos from selfies. Explore ready-made styles or train a personal AI model, then turn any prompt into photos that still look like you.';
const commercialShareClaim = /(?:[$€£¥₹₽]\s*\d|\d+\s*cr\b|\b(?:credits?|pro|max|subscriptions?|subs?|pay[\s-]*as[\s-]*you[\s-]*go|plans?|pricing|prices?|resolution|[1248]k)\b|cr[eé]dit(?:s|os)?|kredit(?:e|en|s)?|abonnement|suscripci[oó]n|forfait|tarif|кредит|подписк|тариф|积分|订阅|套餐|クレジット|サブスクリプション|プラン|क्रेडिट|सदस्यता|प्लान|أرصدة|رصيد|اشتراك|خطة|الدقة|auflösung|r[ée]solution|resoluci[oó]n|разрешени|分辨率|画质|解像度|रिज़ॉल्यूशन)/iu;

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function loadPricingModule() {
  const source = await readProjectFile('src/lib/pricing.ts');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: 'pricing.ts',
  }).outputText;
  const module = { exports: {} };
  const evaluate = new Function('exports', 'module', 'require', output);
  evaluate(module.exports, module, require);
  return module.exports;
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
      [offer.priceUsd, offer.credits, offer.creditGrantPeriod],
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
      ['personalModelImage', 2, 2],
      ['standardImage', 3, 3],
      ['proImage', 7, 10],
      ['maxImage', 20, 20],
      ['standardTraining', 150, 150],
      ['fullTraining', 300, 300],
    ],
  );
  assert.equal(Math.round((1 - offers['pro-annual'].priceUsd / (offers['pro-monthly'].priceUsd * 12)) * 100), 17);
  assert.equal(Math.round((1 - offers['max-annual'].priceUsd / (offers['max-monthly'].priceUsd * 12)) * 100), 17);
  assert.equal('monthlyEquivalentUsd' in offers['pro-annual'], false);
  assert.equal('monthlyEquivalentUsd' in offers['max-annual'], false);
});

test('all locales provide the pricing, use-case, model, and mask copy used by the UI', async () => {
  const requiredPaths = [
    'hero.description',
    'hero.microcopy',
    'navigation.skipToContent',
    'navigation.mainNavigation',
    'navigation.openMenu',
    'navigation.closeMenu',
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
    'useCase.pricingCard.payg',
    'useCase.pricingCard.pro',
    'useCase.pricingCard.max',
    'useCase.stickyCta.label',
    'models.creditUnit',
    'models.meta.shareTitle',
    'models.meta.shareDescription',
    'models.table.columns.credits',
    'models.table.columns.resolution',
    'models.table.columns.access',
    'models.access.payg',
    'models.access.pro',
    'models.access.max',
    'masks.creditCost',
  ];

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const dottedPath of requiredPaths) {
      const value = valueAtPath(messages, dottedPath);
      assert.equal(
        typeof value === 'string' && value.trim().length > 0,
        true,
        `${locale} is missing ${dottedPath}`,
      );
    }
  }
});

test('localized pricing, model, and page-copy schemas stay in lockstep with English', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));

  for (const locale of localeCodes.filter((code) => code !== 'en')) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const namespace of ['pricing', 'models', 'pageCopy']) {
      assert.deepEqual(
        leafPaths(messages[namespace]),
        leafPaths(english[namespace]),
        `${locale}.${namespace} keys differ from English`,
      );
    }
  }
});

test('localized page and social metadata stays concise, translated, and evergreen', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));

  for (const locale of localeCodes) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    const { home, useCases } = messages.pageCopy;
    const modelMeta = messages.models.meta;

    assert.ok([...home.metaTitle].length <= 60, `${locale} home meta title is too long`);
    assert.ok([...home.metaDescription].length <= 160, `${locale} home meta description is too long`);
    assert.ok([...home.shareTitle].length <= 60, `${locale} home share title is too long`);
    assert.ok([...home.shareDescription].length <= 160, `${locale} home share description is too long`);
    assert.ok([...modelMeta.shareTitle].length <= 60, `${locale} model share title is too long`);
    assert.ok([...modelMeta.shareDescription].length <= 160, `${locale} model share description is too long`);
    assert.doesNotMatch(home.shareTitle, commercialShareClaim, `${locale} home share title is commercial`);
    assert.doesNotMatch(home.shareDescription, commercialShareClaim, `${locale} home share description is commercial`);
    assert.doesNotMatch(modelMeta.shareTitle, commercialShareClaim, `${locale} model share title is commercial`);
    assert.doesNotMatch(modelMeta.shareDescription, commercialShareClaim, `${locale} model share description is commercial`);
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
        modelMeta.shareDescription,
        english.models.meta.shareDescription,
        `${locale} model share description is still English`,
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
    rootModels,
    localizedModels,
    useCaseSeo,
  ] = await Promise.all([
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
    readProjectFile('src/app/models/page.tsx'),
    readProjectFile('src/app/[locale]/models/page.tsx'),
    readProjectFile('src/lib/usecase-seo.ts'),
  ]);

  assert.equal((rootLayout.match(new RegExp(englishShareTitle, 'g')) || []).length, 2);
  assert.equal((rootLayout.match(new RegExp(englishShareDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 2);
  for (const source of [rootHome, localizedHome]) {
    assert.equal((source.match(/title: shareTitle/g) || []).length, 2);
    assert.equal((source.match(/description: shareDescription/g) || []).length, 2);
  }
  for (const source of [rootModels, localizedModels]) {
    assert.equal((source.match(/title: shareTitle/g) || []).length, 2);
    assert.equal((source.match(/description: shareDescription/g) || []).length, 2);
  }

  assert.match(useCaseSeo, /const description = appendPlanSummary\(/);
  assert.match(useCaseSeo, /const socialDescription = buildUseCaseSocialDescription\(/);
  assert.equal((useCaseSeo.match(/description: socialDescription/g) || []).length, 2);
});

test('active copy and SEO do not revive the retired cash-per-image story', async () => {
  const targetedPaths = [
    'hero.microcopy',
    'features.affordablePricing.description',
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
  assert.match(pricingUi, /const displayPrice = offer\.priceUsd;/);
  assert.match(pricingUi, /billing\.units\.perYear/);

  const structuredDataSources = await Promise.all([
    readProjectFile('src/components/seo/HomeJsonLd.tsx'),
    readProjectFile('src/components/seo/UseCaseProductJsonLd.tsx'),
    readProjectFile('src/lib/product-offer.ts'),
  ]);
  const structuredData = structuredDataSources.join('\n');
  assert.match(structuredData, /OfferCatalog/);
  assert.doesNotMatch(structuredData, /AggregateOffer|shippingDetails|MerchantReturnNotPermitted/);

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
    readProjectFile('src/app/models/page.tsx'),
    readProjectFile('src/app/[locale]/models/page.tsx'),
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
  const genericCardReferences = genericCardSources.join('\n').match(/(?:https:\/\/myaiphotoshoot\.com)?\/og-image-v2\.jpg(?:\?v=3)?/g) || [];
  assert.ok(genericCardReferences.length > 0);
  assert.equal(
    genericCardReferences.every((reference) => reference.endsWith('?v=3')),
    true,
    'generic social-card references must use the v3 cache key',
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
