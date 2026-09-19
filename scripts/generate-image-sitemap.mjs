import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';
const GALLERY_URL = 'https://myaiphotoshoot.com/gallery/';
const PAGE_SIZE = 100;
const MAX_IMAGES = 1000;
const GALLERY_IMAGE_WIDTH = 420;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function imageUrlForSitemap(publicUrl) {
  if (publicUrl.includes('supabase.co') || /([?&])width=\d+/i.test(publicUrl)) {
    return publicUrl;
  }
  return `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}width=${GALLERY_IMAGE_WIDTH}`;
}

export function buildImageSitemap(pages) {
  const imageUrls = [];
  const seenUrls = new Set();

  for (const photo of pages.flat()) {
    if (imageUrls.length >= MAX_IMAGES) break;
    const publicUrl = typeof photo?.public_url === 'string' ? photo.public_url.trim() : '';
    if (!publicUrl.startsWith('https://')) continue;

    const imageUrl = imageUrlForSitemap(publicUrl);
    if (seenUrls.has(imageUrl)) continue;
    seenUrls.add(imageUrl);
    imageUrls.push(imageUrl);
  }

  if (imageUrls.length === 0) {
    throw new Error('public-gallery returned no valid image URLs');
  }

  const images = imageUrls
    .map((imageUrl) => `    <image:image><image:loc>${escapeXml(imageUrl)}</image:loc></image:image>`)
    .join('\n');

  return {
    imageCount: imageUrls.length,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${GALLERY_URL}</loc>
${images}
  </url>
</urlset>\n`,
  };
}

async function fetchGalleryPage(fetchImpl, functionsUrl, page) {
  const url = new URL(`${functionsUrl.replace(/\/$/, '')}/public-gallery`);
  url.search = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: 'popular',
    platform: 'web',
  }).toString();

  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`public-gallery page ${page} returned ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`public-gallery page ${page} returned an invalid response`);
  }
  return data;
}

export async function generateImageSitemap({
  fetchImpl = fetch,
  functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || DEFAULT_FUNCTIONS_URL,
  outputPath = path.join(process.cwd(), 'out', 'image-sitemap.xml'),
} = {}) {
  const pageCount = Math.ceil(MAX_IMAGES / PAGE_SIZE);
  const pages = await Promise.all(
    Array.from(
      { length: pageCount },
      (_, index) => fetchGalleryPage(fetchImpl, functionsUrl, index + 1),
    ),
  );
  const { imageCount, xml } = buildImageSitemap(pages);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, 'utf8');
  return { imageCount, outputPath };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const result = await generateImageSitemap();
  console.log(`Generated image sitemap with ${result.imageCount} images: ${result.outputPath}`);
}
