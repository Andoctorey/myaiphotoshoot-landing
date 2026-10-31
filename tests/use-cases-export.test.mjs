import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'out');
const siteUrl = 'https://myaiphotoshoot.com';

function decodeHtml(text) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity.startsWith('#')) {
      return String.fromCodePoint(entity[1].toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10));
    }
    return entities[entity.toLowerCase()];
  });
}

test('exported use cases schema matches the visible catalog in every locale', async () => {
  const locales = (await readdir(path.join(projectRoot, 'messages'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const routes = [
    { prefix: '', locale: 'en' },
    ...locales.map((locale) => ({ prefix: locale, locale })),
  ];

  for (const { prefix, locale } of routes) {
    const htmlPath = path.join(outputRoot, prefix, 'use-cases', 'index.html');
    const label = path.relative(projectRoot, htmlPath);
    const html = await readFile(htmlPath, { encoding: 'utf8' });
    const schemas = Array.from(
      html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
      (match) => JSON.parse(match[1]),
    );
    const collections = schemas.filter((schema) => schema['@type'] === 'CollectionPage');
    assert.equal(collections.length, 1, `${label} must describe exactly one catalog`);
    const [collection] = collections;

    const routePrefix = locale === 'en' ? '' : `/${locale}`;
    const pageUrl = `${siteUrl}${routePrefix}/use-cases/`;
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(canonical, `${label} is missing its canonical URL`);
    assert.ok(heading, `${label} is missing its catalog title or intro`);
    assert.equal(decodeHtml(canonical[1]), pageUrl, `${label} canonical URL`);
    assert.equal(collection.url, pageUrl, `${label} schema URL`);
    assert.equal(collection['@id'], `${pageUrl}#webpage`, `${label} schema ID`);
    assert.equal(collection.inLanguage, locale, `${label} schema language`);
    assert.equal(collection.name, decodeHtml(heading[1]), `${label} schema title`);
    assert.equal(collection.description, decodeHtml(heading[2]), `${label} schema intro`);
    assert.ok(
      schemas.some((schema) => schema['@type'] === 'WebSite'
        && schema['@id'] === collection.isPartOf?.['@id']),
      `${label} must reference the sitewide WebSite`,
    );

    const cards = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .flatMap((match) => {
        const title = match[2].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
        return title ? [{ href: decodeHtml(match[1]), title: decodeHtml(title[1]) }] : [];
      });
    const list = collection.mainEntity;
    assert.equal(list?.['@type'], 'ItemList', `${label} catalog list type`);
    assert.equal(list.numberOfItems, cards.length, `${label} catalog count`);
    assert.ok(Array.isArray(list.itemListElement), `${label} must include its catalog entries`);
    assert.equal(list.itemListElement.length, cards.length, `${label} schema entry count`);

    for (const [index, card] of cards.entries()) {
      const entry = list.itemListElement[index];
      const guideLabel = `${label} guide ${index + 1} (${card.title})`;
      assert.equal(entry['@type'], 'ListItem', `${guideLabel} schema type`);
      assert.equal(entry.position, index + 1, `${guideLabel} schema position`);
      assert.equal(entry.name, card.title, `${guideLabel} schema title`);
      assert.equal(entry.url, new URL(card.href, siteUrl).href, `${guideLabel} schema URL`);
      assert.ok(card.href.startsWith(`${routePrefix}/use-cases/`), `${guideLabel} link locale`);
      await assert.doesNotReject(
        access(path.join(outputRoot, card.href.slice(1), 'index.html')),
        `${guideLabel} must have an exported detail page`,
      );
    }
  }
});
