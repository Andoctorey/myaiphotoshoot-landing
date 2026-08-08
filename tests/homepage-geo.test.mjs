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
  ['Models', 'https://myaiphotoshoot.com/models/'],
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

test('server and client gallery paths use the same compact DTO mapper', async () => {
  const [homeDataSource, gallerySource, galleryTypesSource] = await Promise.all([
    readProjectFile('src/lib/homeData.ts'),
    readProjectFile('src/components/features/Gallery.tsx'),
    readProjectFile('src/types/gallery.ts'),
  ]);

  assert.match(homeDataSource, /toHomepageGalleryItem\(item\)/);
  assert.match(gallerySource, /data\.map\(toHomepageGalleryItem\)/);
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

test('the retired app showcase trainModel translation is absent from every locale', async () => {
  const messagesRoot = path.join(projectRoot, 'messages');
  const locales = (await readdir(messagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.ok(locales.length > 0, 'no locale message directories were found');
  for (const locale of locales) {
    const messages = JSON.parse(await readProjectFile(`messages/${locale}/index.json`));
    assert.equal(
      Object.hasOwn(messages.appShowcase ?? {}, 'trainModel'),
      false,
      `${locale} still contains appShowcase.trainModel`,
    );
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
