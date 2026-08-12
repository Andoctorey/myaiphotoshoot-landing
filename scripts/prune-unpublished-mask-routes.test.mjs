import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  publishedMaskCategoryRoutes,
  pruneUnpublishedMaskRoutes,
} from './prune-unpublished-mask-routes.mjs';

function writeRoute(outDir, route, html, text = 'route payload') {
  const routeDirectory = path.join(outDir, ...route.split('/').filter(Boolean));
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.writeFileSync(path.join(routeDirectory, 'index.html'), html);
  fs.writeFileSync(path.join(routeDirectory, 'index.txt'), text);
  return routeDirectory;
}

function writeSitemap(outDir, routes) {
  const entries = routes.map((route) => `<url><loc>https://myaiphotoshoot.com${route}</loc></url>`).join('');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<urlset>${entries}</urlset>`);
}

function makeOutput(t) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'landing-mask-export-test-'));
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  writeRoute(outDir, '/masks/', '<html><head></head><body>Mask index</body></html>');
  writeRoute(outDir, '/en/masks/', '<html><head></head><body>Redirected mask index</body></html>');
  writeRoute(outDir, '/fr/masks/', '<html><head></head><body>Index des masques</body></html>');
  return outDir;
}

test('extracts only mask category URLs from the sitemap', () => {
  const sitemap = [
    '<urlset>',
    '<url><loc>https://myaiphotoshoot.com/masks/</loc></url>',
    '<url><loc>https://myaiphotoshoot.com/masks/hair/</loc></url>',
    '<url><loc>https://myaiphotoshoot.com/fr/masks/corps/</loc></url>',
    '<url><loc>https://myaiphotoshoot.com/blog/masks/</loc></url>',
    '</urlset>',
  ].join('');

  assert.deepEqual(
    [...publishedMaskCategoryRoutes(sitemap)].sort(),
    ['fr/masks/corps', 'masks/hair'],
  );
});

test('keeps sitemap-listed exports and removes every generated unpublished route directory', (t) => {
  const outDir = makeOutput(t);
  const published = writeRoute(
    outDir,
    '/masks/hair/',
    '<html><head><meta name="robots" content="index, follow"/></head><body>Hair guide</body></html>',
  );
  const localizedPublished = writeRoute(
    outDir,
    '/fr/masks/cheveux/',
    '<html><head><meta name="robots" content="index, follow"/></head><body>Cheveux</body></html>',
  );
  const unpublished = writeRoute(
    outDir,
    '/masks/beard/',
    '<html><head><meta name="robots" content="noindex"/></head><body>404</body></html>',
    'NEXT_HTTP_ERROR_FALLBACK;404',
  );
  const localizedUnpublished = writeRoute(
    outDir,
    '/fr/masks/body/',
    '<html><head><meta name="robots" content="noindex"/></head><body>404</body></html>',
  );
  const englishAlias = writeRoute(
    outDir,
    '/en/masks/hair/',
    '<html><head><meta name="robots" content="index, follow"/></head><body>Alias</body></html>',
  );
  const unrelated = writeRoute(
    outDir,
    '/blog/noindex-article/',
    '<html><head><meta name="robots" content="noindex"/></head><body>Draft</body></html>',
  );
  writeSitemap(outDir, ['/masks/', '/masks/hair/', '/fr/masks/cheveux/']);

  const removedRoutes = pruneUnpublishedMaskRoutes(outDir);

  assert.deepEqual(removedRoutes, ['/en/masks/hair/', '/fr/masks/body/', '/masks/beard/']);
  assert.equal(fs.existsSync(unpublished), false);
  assert.equal(fs.existsSync(localizedUnpublished), false);
  assert.equal(fs.existsSync(englishAlias), false);
  assert.equal(fs.existsSync(published), true);
  assert.equal(fs.existsSync(path.join(published, 'index.txt')), true);
  assert.equal(fs.existsSync(localizedPublished), true);
  assert.equal(fs.existsSync(unrelated), true);
  assert.equal(fs.existsSync(path.join(outDir, 'masks', 'index.html')), true);
});

test('supports a build with zero published mask category routes', (t) => {
  const outDir = makeOutput(t);
  writeRoute(outDir, '/masks/aging/', '<html><head><meta name="robots" content="noindex"/></head></html>');
  writeRoute(outDir, '/fr/masks/aging/', '<html><head><meta name="robots" content="noindex"/></head></html>');
  writeSitemap(outDir, ['/masks/', '/fr/masks/']);

  assert.deepEqual(pruneUnpublishedMaskRoutes(outDir), ['/fr/masks/aging/', '/masks/aging/']);
  assert.deepEqual(pruneUnpublishedMaskRoutes(outDir), []);
  assert.equal(fs.existsSync(path.join(outDir, 'masks', 'index.html')), true);
  assert.equal(fs.existsSync(path.join(outDir, 'fr', 'masks', 'index.html')), true);
});

test('fails before pruning when a sitemap-listed route is missing or noindex', (t) => {
  const outDir = makeOutput(t);
  const unpublished = writeRoute(
    outDir,
    '/masks/beard/',
    '<html><head><meta name="robots" content="noindex"/></head><body>404</body></html>',
  );
  writeSitemap(outDir, ['/masks/hair/']);

  assert.throws(
    () => pruneUnpublishedMaskRoutes(outDir),
    /Published mask category route is missing from the static export: \/masks\/hair\//,
  );
  assert.equal(fs.existsSync(unpublished), true);

  writeRoute(
    outDir,
    '/masks/hair/',
    '<html><head><meta content="noindex, nofollow" name="robots"/></head><body>404</body></html>',
  );
  assert.throws(
    () => pruneUnpublishedMaskRoutes(outDir),
    /Published mask category route was exported as noindex: \/masks\/hair\//,
  );
  assert.equal(fs.existsSync(unpublished), true);
});
