import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  buildImageSitemap,
  generateImageSitemap,
} from '../scripts/generate-image-sitemap.mjs';

async function temporaryOutput(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'image-sitemap-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return path.join(directory, 'image-sitemap.xml');
}

test('writes up to 1,000 unique popular gallery images as XML', async (t) => {
  const outputPath = await temporaryOutput(t);
  const requestedPages = [];
  const fetchImpl = async (input) => {
    const url = new URL(input);
    const page = Number(url.searchParams.get('page'));
    requestedPages.push(page);
    assert.equal(url.searchParams.get('limit'), '100');
    assert.equal(url.searchParams.get('sort'), 'popular');
    assert.equal(url.searchParams.get('platform'), 'web');

    return Response.json(Array.from({ length: 100 }, (_, index) => ({
      public_url: `https://cdn.myaiphotoshoot.com/photo-${page}-${index}.webp`,
    })));
  };

  const result = await generateImageSitemap({ fetchImpl, outputPath });
  const xml = await readFile(outputPath, 'utf8');

  assert.equal(result.imageCount, 1000);
  assert.deepEqual(requestedPages.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal((xml.match(/<image:image>/g) ?? []).length, 1000);
  assert.match(xml, /<loc>https:\/\/myaiphotoshoot\.com\/gallery\/<\/loc>/);
  assert.match(xml, /photo-1-0\.webp\?width=420/);
});

test('escapes image URLs and removes duplicates or invalid URLs', () => {
  const { imageCount, xml } = buildImageSitemap([[
    { public_url: 'https://cdn.myaiphotoshoot.com/photo.webp?width=100&quality=80' },
    { public_url: 'https://cdn.myaiphotoshoot.com/photo.webp?width=100&quality=80' },
    { public_url: 'https://example.supabase.co/storage/v1/object/public/photo.webp' },
    { public_url: 'http://cdn.myaiphotoshoot.com/insecure.webp' },
    { public_url: '' },
  ]]);

  assert.equal(imageCount, 2);
  assert.match(xml, /width=100&amp;quality=80/);
  assert.match(xml, /example\.supabase\.co\/storage\/v1\/object\/public\/photo\.webp/);
  assert.doesNotMatch(xml, /example\.supabase\.co[^<]*width=420/);
});

test('does not publish a partial sitemap when an upstream page fails', async (t) => {
  const outputPath = await temporaryOutput(t);
  const fetchImpl = async (input) => {
    const page = Number(new URL(input).searchParams.get('page'));
    return page === 4
      ? new Response('failure', { status: 503 })
      : Response.json([]);
  };

  await assert.rejects(
    generateImageSitemap({ fetchImpl, outputPath }),
    /public-gallery page 4 returned 503/,
  );
  await assert.rejects(access(outputPath), { code: 'ENOENT' });
});

test('deployment serves the photo shell and image sitemap as static files', async () => {
  const [routesSource, redirects, headers, robotsSource, packageSource] = await Promise.all([
    readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'),
    readFile(new URL('../public/_redirects', import.meta.url), 'utf8'),
    readFile(new URL('../public/_headers', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/robots.ts', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ]);
  const routes = JSON.parse(routesSource);
  const packageJson = JSON.parse(packageSource);

  assert.equal(routes.include.includes('/image-sitemap.xml'), false);
  assert.equal(routes.include.includes('/photo/*'), false);
  assert.match(redirects, /^\/photo\/\* \/photo\/index\.html 200$/m);
  assert.match(headers, /^\/image-sitemap\.xml[\s\S]*?s-maxage=86400/m);
  assert.match(robotsSource, /https:\/\/myaiphotoshoot\.com\/image-sitemap\.xml/);
  assert.match(packageJson.scripts.build, /node scripts\/generate-image-sitemap\.mjs/);

  await assert.rejects(
    access(new URL('../functions/image-sitemap.xml.js', import.meta.url)),
    { code: 'ENOENT' },
  );
  await assert.rejects(
    access(new URL('../functions/photo/[[path]].js', import.meta.url)),
    { code: 'ENOENT' },
  );
});
