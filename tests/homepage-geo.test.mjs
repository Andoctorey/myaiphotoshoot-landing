import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PROMPT_SUMMARY_LENGTH = 60;
const canonicalPages = [
  ['Home', 'https://myaiphotoshoot.com/'],
  ['Presets', 'https://myaiphotoshoot.com/presets/'],
  ['Masks', 'https://myaiphotoshoot.com/masks/'],
  ['Studio – Custom AI Photo Creation', 'https://myaiphotoshoot.com/studio/'],
  ['Use Cases', 'https://myaiphotoshoot.com/use-cases/'],
  ['Blog', 'https://myaiphotoshoot.com/blog/'],
  ['Legal', 'https://myaiphotoshoot.com/legal/'],
];

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function loadHomepageGalleryModule() {
  const source = await readProjectFile('src/lib/homepage-gallery.ts');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: 'homepage-gallery.ts',
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(moduleUrl);
}

test('homepage gallery mapping keeps only a 60-character prompt summary', async () => {
  const { summarizeGalleryPrompt, toHomepageGalleryItem } = await loadHomepageGalleryModule();
  const fullPrompt = [
    '  Photorealistic   portrait with soft window light, a detailed studio background,',
    'and a complete private prompt suffix that must never enter the homepage payload.  ',
  ].join('\n');

  assert.equal(summarizeGalleryPrompt('  short\n\tprompt  '), 'short prompt');
  assert.equal(summarizeGalleryPrompt('a'.repeat(60)), 'a'.repeat(60));
  assert.equal(summarizeGalleryPrompt('b'.repeat(61)), `${'b'.repeat(59)}…`);

  const item = toHomepageGalleryItem({
    id: '  gallery-id  ',
    created_at: '2026-08-08T00:00:00.000Z',
    public_url: '  https://cdn.myaiphotoshoot.com/gallery.jpg  ',
    prompt: fullPrompt,
    preset_id: '  preset/key  ',
  });

  assert.deepEqual(item, {
    id: 'gallery-id',
    publicUrl: 'https://cdn.myaiphotoshoot.com/gallery.jpg',
    promptSummary: summarizeGalleryPrompt(fullPrompt),
    presetId: 'preset/key',
  });
  assert.equal(Object.hasOwn(item, 'prompt'), false);
  assert.equal(Object.hasOwn(item, 'created_at'), false);
  assert.equal(Object.hasOwn(item, 'public_url'), false);
  assert.equal(Object.hasOwn(item, 'preset_id'), false);
  assert.ok(item.promptSummary.length <= MAX_PROMPT_SUMMARY_LENGTH);
  assert.ok(item.promptSummary.length > 0);
  assert.equal(item.promptSummary.endsWith('…'), true);
  assert.equal(item.promptSummary.includes('private prompt suffix'), false);
});

test('gallery is loaded dynamically with the compact DTO mapper', async () => {
  const [homeDataSource, gallerySource, galleryTypesSource] = await Promise.all([
    readProjectFile('src/lib/homeData.ts'),
    readProjectFile('src/components/features/Gallery.tsx'),
    readProjectFile('src/types/gallery.ts'),
  ]);

  assert.match(homeDataSource, /const initialGallery: HomepageGalleryItem\[\] = \[\]/);
  assert.doesNotMatch(homeDataSource, /\/public-gallery\?/);
  assert.match(gallerySource, /data\.map\(toHomepageGalleryItem\)/);
  assert.match(gallerySource, /platform: 'web'/);
  assert.match(gallerySource, /item\.promptSummary/);
  assert.doesNotMatch(gallerySource, /item\.prompt\b/);
  assert.match(gallerySource, /src=\{item\.publicUrl\}/);
  assert.match(gallerySource, /linkHref=\{buildGalleryItemAppHref\(item\)\}/);
  assert.match(gallerySource, /alt=\{`\$\{t\('altPrefix'\)\}: \$\{item\.promptSummary\}`\}/);
  assert.match(gallerySource, /ariaLabel=\{`\$\{t\('captionPrefix'\)\}: \$\{item\.promptSummary\}`\}/);
  assert.match(galleryTypesSource, /interface HomepageGalleryItem/);
  assert.match(galleryTypesSource, /promptSummary:\s*string/);
  assert.doesNotMatch(galleryTypesSource, /^\s*prompt:\s*string/m);
});

test('homepage translations include active labels and omit retired copy', async () => {
  const messagesRoot = path.join(projectRoot, 'messages');
  const locales = (await readdir(messagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.ok(locales.length > 0, 'no locale message directories were found');
  for (const locale of locales) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    assert.equal(
      typeof messages.appShowcase?.label === 'string' && messages.appShowcase.label.trim().length > 0,
      true,
      `${locale} is missing appShowcase.label`,
    );
    assert.equal(
      Object.hasOwn(messages.appShowcase ?? {}, 'trainModel'),
      false,
      `${locale} still contains appShowcase.trainModel`,
    );
    assert.equal(
      Object.hasOwn(messages.features ?? {}, 'optionalPersonalModel'),
      false,
      `${locale} still contains features.optionalPersonalModel`,
    );
    assert.equal(
      Object.hasOwn(messages.features ?? {}, 'affordablePricing'),
      false,
      `${locale} still contains unused features.affordablePricing`,
    );
    assert.equal(
      Object.hasOwn(messages.hero ?? {}, 'microcopy'),
      false,
      `${locale} still contains unused hero.microcopy`,
    );
  }
});

test('homepage SEO copy and focused use-case links stay wired', async () => {
  const englishMessages = JSON.parse(await readProjectFile('messages/en/index.json'));
  const heroSource = await readProjectFile('src/components/features/Hero.tsx');
  const homeUseCasesSource = await readProjectFile('src/components/features/HomeUseCases.tsx');
  const useCaseLinks = [
    ['headshots', 'ai-headshot-generator-for-linkedin-resumes-and-team-pages'],
    ['business', 'ai-business-headshot-generator-professional-photos'],
    ['linkedin', 'ai-linkedin-headshot-generator-professional-profiles'],
    ['dating', 'ai-dating-profile-picture-generator'],
    ['profiles', 'ai-profile-picture-generator-realistic-headshots-avatars'],
    ['portraits', 'ai-portrait-generator-for-hyper-realistic-headshots-art'],
  ];

  assert.deepEqual(englishMessages.pageCopy.home, {
    metaTitle: 'My AI Photoshoot: Personalized AI Photo Generator',
    metaDescription: 'Create a realistic AI photoshoot from one photo, a prompt, or a reference image. Make headshots, profile pictures, portraits, avatars, and new looks.',
    shareTitle: 'One AI Photoshoot. Every Version of You.',
    shareDescription: 'Create realistic headshots, profile pictures, portraits, avatars, and new looks from one photo, a prompt, or a reference image.',
  });
  assert.equal(englishMessages.hero.title, 'One AI Photoshoot.');
  assert.equal(englishMessages.hero.titleHighlight, 'Every Version of You.');
  assert.equal(
    englishMessages.hero.description,
    'Turn a photo, reference, or idea into realistic headshots, profile pictures, portraits, and new looks.',
  );

  assert.doesNotMatch(heroSource, /useCases\.|USE_CASE_LINKS|<nav/);
  for (const [key, slug] of useCaseLinks) {
    assert.match(homeUseCasesSource, new RegExp(`cards\\.${key}`));
    assert.match(homeUseCasesSource, new RegExp(`slug: '${slug}'`));
  }
  assert.match(homeUseCasesSource, /localePath\(locale, `\/use-cases\/\$\{it\.slug\}\/`\)/);
  assert.match(homeUseCasesSource, /overflow-x-auto/);
  assert.match(homeUseCasesSource, /snap-x snap-mandatory/);
  assert.match(homeUseCasesSource, /w-\[78vw\][^"\n]*snap-center/);
  assert.match(homeUseCasesSource, /lg:grid[^"\n]*lg:grid-cols-3/);

  for (const locale of ['en', 'es', 'fr', 'de', 'ru', 'ja', 'zh', 'ar', 'hi']) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    for (const [key] of useCaseLinks) {
      assert.equal(
        typeof messages.homeUseCases.cards[key],
        'string',
        `${locale} is missing homeUseCases.cards.${key}`,
      );
    }
  }
});

test('promotional collections scroll on mobile while the public gallery stays dense', async () => {
  const [blogSource, gallerySource] = await Promise.all([
    readProjectFile('src/components/features/HomeBlog.tsx'),
    readProjectFile('src/components/features/Gallery.tsx'),
  ]);

  assert.match(blogSource, /overflow-x-auto/);
  assert.match(blogSource, /snap-x snap-mandatory/);
  assert.match(blogSource, /w-\[78vw\][^"\n]*snap-center/);
  assert.match(blogSource, /lg:grid[^"\n]*lg:grid-cols-3/);
  assert.match(blogSource, /takeFirst\(sortByMostRecent\(initialPosts\), HOME_BLOG_COUNT\)/);
  assert.doesNotMatch(blogSource, /index >= 3|hidden md:block|columns-[123]/);

  assert.match(gallerySource, /grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4[^"\n]*lg:grid-cols-5/);
  assert.doesNotMatch(gallerySource, /overflow-x-auto|snap-x|snap-mandatory/);
});

test('homepage collections keep their intentional item counts', async () => {
  const [useCases, blog, presets, masks, showcase, gallery] = await Promise.all([
    readProjectFile('src/components/features/HomeUseCases.tsx'),
    readProjectFile('src/components/features/HomeBlog.tsx'),
    readProjectFile('src/components/features/HomePresets.tsx'),
    readProjectFile('src/components/features/HomeMasks.tsx'),
    readProjectFile('src/components/features/AppShowcase.tsx'),
    readProjectFile('src/components/features/Gallery.tsx'),
  ]);

  const featuredUseCases = useCases.slice(
    useCases.indexOf('const featuredUseCases'),
    useCases.indexOf('const orderedUseCases'),
  );
  assert.equal((featuredUseCases.match(/slug: '/g) || []).length, 6);
  assert.match(blog, /const HOME_BLOG_COUNT = 6/);
  assert.match(presets, /const HOME_PRESET_COUNT = 6/);
  assert.match(presets, /const HOME_PRESET_FETCH_SIZE = 12/);
  assert.match(presets, /\.slice\(0, HOME_PRESET_COUNT\)/);
  const demandPriorityMasks = masks.slice(
    masks.indexOf('const DEMAND_PRIORITY_MASKS'),
    masks.indexOf('type MaskComparison'),
  );
  const maskSelections = [
    ['aging', 'prime'],
    ['expression', 'smile'],
    ['hair', 'wolf-cut'],
    ['body', 'abs'],
    ['outfit', 'prom'],
    ['outfit-men', 'cardigan'],
  ];
  assert.equal((demandPriorityMasks.match(/maskSlug:/g) || []).length, 6);
  for (const [categorySlug, maskSlug] of maskSelections) {
    assert.match(
      demandPriorityMasks,
      new RegExp(`categorySlug: '${categorySlug}', maskSlug: '${maskSlug}'`),
    );
  }
  assert.match(
    demandPriorityMasks,
    /\{ categorySlug: 'outfit-men', maskSlug: 'cardigan' \},\s*\] as const;/,
  );
  assert.match(masks, /item\.slug === featured\.maskSlug/);
  assert.match(masks, /\.slice\(0, DEMAND_PRIORITY_MASKS\.length\)/);
  assert.equal((showcase.match(/src: '\/images\/app-showcase\//g) || []).length, 5);
  assert.match(showcase, /<h2[\s\S]*id="app-showcase-heading"/);
  assert.match(showcase, /\{t\('label'\)\}/);
  assert.match(showcase, /text-sm font-semibold uppercase tracking-wide text-primary/);
  assert.match(gallery, /const PAGE_SIZE = 20/);
  assert.match(gallery, /const INITIAL_VISIBLE_COUNT = 20/);
});

test('homepage positioning emphasizes core creation workflows', async () => {
  const englishMessages = JSON.parse(await readProjectFile('messages/en/index.json'));
  const positioningCopy = [
    englishMessages.pageCopy.home.metaDescription,
    englishMessages.hero.description,
    englishMessages.homeUseCases.description,
    englishMessages.features.description,
    englishMessages.footer.description,
    englishMessages.faq.howItWorks.answer,
    englishMessages.faq.whyNotChatGPT.answer,
  ];

  for (const value of positioningCopy) {
    assert.equal(typeof value, 'string');
  }
  assert.doesNotMatch(
    positioningCopy.join(' '),
    /personal(?: AI)? models?|personal-model training/i,
  );
  assert.match(englishMessages.hero.description, /photo, reference, or idea/i);
  assert.match(englishMessages.faq.howItWorks.answer, /photo, reference, or idea/i);

  const [featuresSource, rootLayout, localeLayout, rootPage, localePage] = await Promise.all([
    readProjectFile('src/components/features/Features.tsx'),
    readProjectFile('src/app/layout.tsx'),
    readProjectFile('src/app/[locale]/layout.tsx'),
    readProjectFile('src/app/page.tsx'),
    readProjectFile('src/app/[locale]/page.tsx'),
  ]);
  assert.match(featuresSource, /t\('easyCustomization\.title'\)/);
  assert.match(featuresSource, /t\('easyCustomization\.description'\)/);
  assert.doesNotMatch(featuresSource, /optionalPersonalModel/);
  for (const source of [rootLayout, localeLayout, rootPage, localePage]) {
    assert.doesNotMatch(source, /personal model training is optional/i);
  }
});

test('llms.txt is concise factual text with exactly the canonical product links', async () => {
  const llmsText = await readProjectFile('public/llms.txt');

  assert.match(llmsText, /^# My AI Photo Shoot\n\n> [^\n]+\n\n## Pages\n/m);
  assert.ok(Buffer.byteLength(llmsText, 'utf8') < 1_000, 'llms.txt is not concise');

  const pages = Array.from(
    llmsText.matchAll(/^- \[([^\]]+)]\((https:\/\/[^)]+)\)$/gm),
    (match) => [match[1], match[2]],
  );
  assert.deepEqual(pages, canonicalPages);
  for (const [, pageUrl] of pages) {
    const url = new URL(pageUrl);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'myaiphotoshoot.com');
  }

  assert.doesNotMatch(
    llmsText,
    /[$€£¥₹₽]|\b(?:costs?|credits?|plans?|prices?|pricing|subscriptions?)\b/i,
  );
  assert.doesNotMatch(llmsText, /\b\d+\+?\s+(?:AI\s+)?Masks?\b/i);
  assert.doesNotMatch(llmsText, /\b(?:best|leading|revolutionary|ultimate|unmatched)\b/i);

  const robotsSource = await readProjectFile('src/app/robots.ts');
  assert.doesNotMatch(robotsSource, /llms\.txt/i);
});

test('web app manifest uses the canonical product name', async () => {
  const manifest = JSON.parse(await readProjectFile('public/site.webmanifest'));

  assert.equal(manifest.name, 'My AI Photo Shoot');
});
