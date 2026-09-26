import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'out');
const MAX_PROMPT_SUMMARY_LENGTH = 60;
const HOMEPAGE_GALLERY_KEYS = ['id', 'presetId', 'promptSummary', 'publicUrl'];

function extractInitialItems(rscSource, relativePath) {
  const marker = '"initialItems":';
  const markerIndex = rscSource.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${relativePath} has no initial gallery payload`);

  const arrayStart = rscSource.indexOf('[', markerIndex + marker.length);
  assert.notEqual(arrayStart, -1, `${relativePath} has an invalid initial gallery payload`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < rscSource.length; index += 1) {
    const character = rscSource[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(rscSource.slice(arrayStart, index + 1));
      }
    }
  }

  assert.fail(`${relativePath} has an unterminated initial gallery payload`);
}

test('exported homepage gallery payloads use only compact DTO fields', async () => {
  const localeCodes = (await readdir(path.join(projectRoot, 'messages'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const homepageBases = [
    path.join(outputRoot, 'index'),
    ...localeCodes.map((locale) => path.join(outputRoot, locale, 'index')),
  ];

  for (const homepageBase of homepageBases) {
    const htmlPath = `${homepageBase}.html`;
    const rscPath = `${homepageBase}.txt`;
    const [html, rsc] = await Promise.all([
      readFile(htmlPath, 'utf8'),
      readFile(rscPath, 'utf8'),
    ]);
    const relativeHtmlPath = path.relative(projectRoot, htmlPath);
    const relativeRscPath = path.relative(projectRoot, rscPath);

    assert.doesNotMatch(
      html,
      /(?:"prompt"|\\"prompt\\"|&quot;prompt&quot;)\s*:/,
      `${relativeHtmlPath} contains a serialized full prompt field`,
    );

    const initialItems = extractInitialItems(rsc, relativeRscPath);
    for (const item of initialItems) {
      assert.deepEqual(
        Object.keys(item).sort(),
        HOMEPAGE_GALLERY_KEYS,
        `${relativeRscPath} contains an unexpected gallery field`,
      );
      assert.equal(typeof item.id, 'string', `${relativeRscPath} contains an invalid gallery ID`);
      assert.equal(typeof item.publicUrl, 'string', `${relativeRscPath} contains an invalid gallery URL`);
      assert.equal(
        typeof item.promptSummary,
        'string',
        `${relativeRscPath} contains an invalid prompt summary`,
      );
      assert.ok(
        item.promptSummary.length > 0 && item.promptSummary.length <= MAX_PROMPT_SUMMARY_LENGTH,
        `${relativeRscPath} contains an invalid prompt summary length`,
      );
      assert.ok(
        item.presetId === null || typeof item.presetId === 'string',
        `${relativeRscPath} contains an invalid preset ID`,
      );
    }
  }
});

test('the production export copies llms.txt without adding robots directives', async () => {
  const [source, exported] = await Promise.all([
    readFile(path.join(projectRoot, 'public', 'llms.txt'), 'utf8'),
    readFile(path.join(outputRoot, 'llms.txt'), 'utf8'),
  ]);

  assert.equal(exported, source);

  const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /llms\.txt/i);
});

test('the production export keeps photo pages noindex and publishes the image sitemap', async () => {
  const [
    photoHtml,
    imageSitemap,
    regularSitemap,
    robots,
    redirects,
    routesSource,
    headers,
  ] = await Promise.all([
    readFile(path.join(outputRoot, 'photo', 'index.html'), 'utf8'),
    readFile(path.join(outputRoot, 'image-sitemap.xml'), 'utf8'),
    readFile(path.join(outputRoot, 'sitemap.xml'), 'utf8'),
    readFile(path.join(outputRoot, 'robots.txt'), 'utf8'),
    readFile(path.join(outputRoot, '_redirects'), 'utf8'),
    readFile(path.join(outputRoot, '_routes.json'), 'utf8'),
    readFile(path.join(outputRoot, '_headers'), 'utf8'),
  ]);
  const routes = JSON.parse(routesSource);
  const imageCount = (imageSitemap.match(/<image:image>/g) ?? []).length;

  assert.match(photoHtml, /<meta name="robots" content="noindex, follow"\/>/);
  assert.match(redirects, /^\/photo\/\* \/photo\/ 200$/m);
  assert.equal(routes.include.includes('/photo'), false);
  assert.equal(routes.include.includes('/photo/*'), false);
  assert.equal(routes.include.includes('/image-sitemap.xml'), false);

  assert.match(
    imageSitemap,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset [^>]*xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/,
  );
  assert.match(imageSitemap, /<loc>https:\/\/myaiphotoshoot\.com\/gallery\/<\/loc>/);
  assert.ok(imageCount > 0 && imageCount <= 1000, `invalid image sitemap count: ${imageCount}`);
  assert.doesNotMatch(regularSitemap, /<loc>https:\/\/myaiphotoshoot\.com\/photo\//);
  assert.match(robots, /^Sitemap: https:\/\/myaiphotoshoot\.com\/image-sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow: \/photo/m);
  assert.match(headers, /^\/image-sitemap\.xml[\s\S]*?Content-Type: application\/xml; charset=utf-8/m);
  assert.doesNotMatch(headers, /^\/photo(?:\/\*)?$/m);
});

test('every exported preset catalog entry has a matching static detail page', async () => {
  const localeCodes = (await readdir(path.join(projectRoot, 'messages'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expectedKeys = [
    'created_at',
    'featured_graphics',
    'featured_graphics_alt',
    'has_active_test',
    'id',
    'name',
    'slug',
  ];

  for (const locale of localeCodes) {
    const catalogPath = path.join(outputRoot, 'preset-catalog', locale);
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    assert.ok(catalog.length > 0, `${locale} preset catalog is empty`);
    const catalogSlugs = catalog.map((preset) => preset.slug).sort();
    const localizedPresetsRoot = path.join(outputRoot, locale, 'presets');
    const exportedSlugs = (await readdir(localizedPresetsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    assert.deepEqual(exportedSlugs, catalogSlugs, `${locale} preset inventory drifted`);

    for (const preset of catalog) {
      assert.deepEqual(Object.keys(preset).sort(), expectedKeys);
      assert.equal(typeof preset.has_active_test, 'boolean');
      const localizedDetailPath = path.join(
        outputRoot,
        locale,
        'presets',
        preset.slug,
        'index.html',
      );
      await readFile(localizedDetailPath, 'utf8');
      if (locale === 'en') {
        await readFile(path.join(outputRoot, 'presets', preset.slug, 'index.html'), 'utf8');
      }
    }

    if (locale === 'en') {
      const rootExportedSlugs = (await readdir(path.join(outputRoot, 'presets'), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
      assert.deepEqual(rootExportedSlugs, catalogSlugs, 'root English preset inventory drifted');
    }
  }

  const headers = await readFile(path.join(outputRoot, '_headers'), 'utf8');
  assert.match(headers, /^\/preset-catalog\/\*[\s\S]*?X-Robots-Tag: noindex, follow/m);
});
