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

test('localized pricing and model schemas stay in lockstep with English', async () => {
  const english = JSON.parse(await readProjectFile('messages/en/index.json'));

  for (const locale of localeCodes.filter((code) => code !== 'en')) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const namespace of ['pricing', 'models']) {
      assert.deepEqual(
        leafPaths(messages[namespace]),
        leafPaths(english[namespace]),
        `${locale}.${namespace} keys differ from English`,
      );
    }
  }
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
