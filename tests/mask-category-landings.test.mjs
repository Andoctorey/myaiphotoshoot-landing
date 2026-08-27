import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readProjectFile = (file) => readFile(path.join(root, file), 'utf8');

function assertNewTabAnchor(source, href) {
  const anchor = source.match(/<a\b[^>]*>/g)?.find((candidate) => candidate.includes(href));
  assert.ok(anchor, `Missing anchor with ${href}`);
  assert.match(anchor, /target="_blank"/);
  assert.match(anchor, /rel="noopener noreferrer"/);
}

test('mask category routes are published-only static exports that fail closed on catalog drift', async () => {
  const [englishRoute, localizedRoute] = await Promise.all([
    readProjectFile('src/app/masks/[slug]/page.tsx'),
    readProjectFile('src/app/[locale]/masks/[slug]/page.tsx'),
  ]);

  for (const source of [englishRoute, localizedRoute]) {
    assert.match(source, /export const dynamicParams = false/);
    assert.match(source, /fetchPublishedMaskCategoryLandings/);
    assert.match(source, /findPublishedMaskCategoryLanding/);
    assert.match(source, /fetchMasksCatalogStrict/);
    assert.match(source, /if \(!landing\) notFound\(\)/);
    assert.match(source, /if \(!categoryExists \|\| !categoryHasMasks\) notFound\(\)/);
    assert.doesNotMatch(source, /export const revalidate = 0/);
  }
  assert.match(englishRoute, /catalog\.categories\.map\(\(category\) => \(\{ slug: category\.slug \}\)\)/);
  assert.match(localizedRoute, /locales\.flatMap\(\(locale\) => catalog\.categories\.map/);
});

test('mask category metadata and sitemap use only published localized siblings', async () => {
  const [landingLib, sitemap] = await Promise.all([
    readProjectFile('src/lib/ai-mask-landings.ts'),
    readProjectFile('src/app/sitemap.ts'),
  ]);

  assert.match(landingLib, /buildPublishedMaskCategoryLanguages/);
  assert.match(landingLib, /publishedMaskCategorySiblings/);
  assert.match(landingLib, /languages\['x-default'\]/);
  assert.match(landingLib, /body\.code === 'PGRST202'/);
  assert.match(landingLib, /response\.status === 404/);
  assert.match(sitemap, /maskCategoryLandings\.map/);
  assert.match(sitemap, /landing\.locale, `\/masks\/\$\{landing\.slug\}\//);
  assert.match(sitemap, /buildPublishedMaskCategoryLanguages\(maskCategoryLandings, landing\.categoryId\)/);
  assert.doesNotMatch(sitemap, /for \(const locale of locales\)[\s\S]{0,200}maskCategoryEntries/);
});

test('visible category content matches FAQ, breadcrumb, collection, and item-list schema', async () => {
  const [component, jsonLd] = await Promise.all([
    readProjectFile('src/components/masks/AiMaskCategoryLandingPage.tsx'),
    readProjectFile('src/lib/ai-mask-category-json-ld.ts'),
  ]);
  assert.doesNotMatch(component, /<main\b/);
  assert.match(component, /splitIntroduction\(landing\.introduction\)/);
  assert.match(component, /function splitIntroduction[\s\S]*split\(\/\\n\\s\*\\n\/u\)/);
  assert.match(component, /landing\.photoGuidance/);
  assert.match(component, /landing\.expectations/);
  assert.match(component, /landing\.limitations/);
  assert.match(component, /landing\.faqs\.map/);
  assert.match(jsonLd, /'@type': 'CollectionPage'/);
  assert.match(jsonLd, /'@type': 'ItemList'/);
  assert.match(jsonLd, /'@id': `\$\{pageUrl\}#mask-\$\{mask\.slug\}`/);
  assert.match(jsonLd, /'@type': 'BreadcrumbList'/);
  assert.match(jsonLd, /'@type': 'FAQPage'/);
  assert.doesNotMatch(jsonLd, /HowTo/);
});

test('mask index links every published guide and labels outfit guides by gender', async () => {
  const [browser, categoryPage] = await Promise.all([
    readProjectFile('src/components/masks/MasksCatalogBrowser.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryLandingPage.tsx'),
  ]);
  assert.match(browser, /publishedCategories = useMemo/);
  assert.match(browser, /OUTFIT_CATEGORY_SLUGS = new Set\(\['outfit', 'outfit-men'\]\)/);
  assert.match(browser, /function categoryGuideName/);
  assert.match(browser, /category\.audienceGender === 'female'.*labels\.female/);
  assert.match(browser, /category\.audienceGender === 'male'.*labels\.male/);
  assert.match(browser, /publishedCategories\.map/);
  assert.match(browser, /const guideName = categoryGuideName\(category, labels\)/);
  assert.match(browser, /href=\{localePath\(locale, `\/masks\/\$\{category\.slug\}\/`\)\}/);
  assert.doesNotMatch(categoryPage, /publishedCategoryIds=\{\[landing\.categoryId\]\}/);
  assert.doesNotMatch(categoryPage, /categoryGuideName/);
});

test('mask cards and CTAs open the web app in a new tab', async () => {
  const [appLinks, catalog, browser, highlights, categoryPage, homeMasks] = await Promise.all([
    readProjectFile('src/lib/app-links.ts'),
    readProjectFile('src/components/masks/AiMasksCatalog.tsx'),
    readProjectFile('src/components/masks/MasksCatalogBrowser.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryHighlights.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryLandingPage.tsx'),
    readProjectFile('src/components/features/HomeMasks.tsx'),
  ]);

  assert.match(appLinks, /function buildMaskAppUrl\(maskId: string\)/);
  assert.match(appLinks, /`\$\{AI_MASKS_APP_URL\}\/\$\{encodeURIComponent\(maskId\)\}`/);
  assert.match(catalog, /url: buildMaskAppUrl\(mask\.id\)/);
  assertNewTabAnchor(browser, 'href={buildMaskAppUrl(mask.id)}');
  assertNewTabAnchor(highlights, 'href={buildMaskAppUrl(selectedMask.id)}');
  assertNewTabAnchor(homeMasks, 'href={buildMaskAppUrl(mask.id)}');
  for (const source of [catalog, browser, categoryPage]) {
    assertNewTabAnchor(source, 'href={AI_MASKS_APP_URL}');
  }
});

test('mask category chrome is translated in every supported locale', async () => {
  const locales = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];
  const keys = [
    'categoryGuide',
    'aboutTitle',
    'iosUnavailable',
    'photoGuidanceTitle',
    'expectationsTitle',
    'limitationsTitle',
    'masksTitle',
    'masksDescription',
    'trainingQuestion',
    'trainingAnswer',
    'faqTitle',
  ];
  for (const locale of locales) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const key of keys) {
      assert.equal(
        typeof messages.masks?.landing?.[key] === 'string' && messages.masks.landing[key].trim().length > 0,
        true,
        `${locale} is missing masks.landing.${key}`,
      );
    }
  }
});

test('mask category pages disclose iOS availability from catalog data', async () => {
  const [catalog, highlights, page] = await Promise.all([
    readProjectFile('src/lib/ai-masks.ts'),
    readProjectFile('src/components/masks/AiMaskCategoryHighlights.tsx'),
    readProjectFile('src/components/masks/AiMaskCategoryLandingPage.tsx'),
  ]);

  assert.match(catalog, /hidden_on_ios/);
  assert.match(catalog, /hiddenOnIos: row\.hidden_on_ios === true/);
  assert.match(highlights, /category\.hiddenOnIos/);
  assert.match(highlights, /iosUnavailableLabel/);
  assert.match(page, /t\('landing\.iosUnavailable'\)/);
});

test('English-prefixed category aliases redirect to canonical root paths', async () => {
  const redirects = await readProjectFile('public/_redirects');
  assert.match(redirects, /^\/en\/masks\/\* \/masks\/:splat 308$/m);
});
