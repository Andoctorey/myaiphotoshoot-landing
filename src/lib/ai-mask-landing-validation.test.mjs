import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./ai-mask-landing-validation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const { normalizePublishedMaskCategoryLandings } = await import(moduleUrl);
const locales = ['en', 'zh', 'hi', 'es', 'de', 'ja', 'ru', 'fr', 'ar'];

function landing(overrides = {}) {
  return {
    category_id: 'category-id',
    slug: 'hair',
    locale: 'en',
    title: 'AI Hair Styles | My AI Photo Shoot',
    description: 'Preview creative hairstyles from one clear portrait.',
    introduction: 'First paragraph.\n\nSecond paragraph.',
    photo_guidance: ['Use a clear portrait.'],
    expectations: ['Results vary by source photo.'],
    limitations: ['Small details may change.'],
    faqs: [{ q: 'Is training required?', a: 'No.' }],
    updated_at: '2026-08-12T12:00:00.000Z',
    ...overrides,
  };
}

test('normalizes a complete published category landing without losing paragraphs', () => {
  const [normalized] = normalizePublishedMaskCategoryLandings([landing()], locales);
  assert.deepEqual(normalized, {
    categoryId: 'category-id',
    slug: 'hair',
    locale: 'en',
    title: 'AI Hair Styles | My AI Photo Shoot',
    description: 'Preview creative hairstyles from one clear portrait.',
    introduction: 'First paragraph.\n\nSecond paragraph.',
    photoGuidance: ['Use a clear portrait.'],
    expectations: ['Results vary by source photo.'],
    limitations: ['Small details may change.'],
    faqs: [{ q: 'Is training required?', a: 'No.' }],
    updatedAt: '2026-08-12T12:00:00.000Z',
  });
});

test('rejects malformed, incomplete, and unsupported published rows', () => {
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([landing({ photo_guidance: [] })], locales),
    /photo_guidance array/,
  );
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([landing({ faqs: [{ q: 'Q', a: 'A', extra: true }] })], locales),
    /invalid faq shape/,
  );
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([landing({ locale: 'it' })], locales),
    /unsupported locale/,
  );
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([landing(), landing()], locales),
    /duplicate routes/,
  );
});

test('rejects category and slug drift across localized siblings', () => {
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([
      landing(),
      landing({ locale: 'fr', slug: 'cheveux' }),
    ], locales),
    /inconsistent category slugs/,
  );
  assert.throws(
    () => normalizePublishedMaskCategoryLandings([
      landing(),
      landing({ category_id: 'other-category', locale: 'fr' }),
    ], locales),
    /inconsistent category slugs/,
  );
});
