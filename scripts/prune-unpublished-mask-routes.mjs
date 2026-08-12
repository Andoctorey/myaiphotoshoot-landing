import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const ROBOTS_NOINDEX_PATTERN = /<meta\b(?=[^>]*\bname=(['"])robots\1)(?=[^>]*\bcontent=(['"])[^'"]*\bnoindex\b[^'"]*\2)[^>]*>/i;

function isDirectory(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

function isMaskIndex(directoryPath) {
  return isDirectory(directoryPath) && fs.existsSync(path.join(directoryPath, 'index.html'));
}

function maskIndexDirectories(outDir) {
  const directories = [];
  const defaultMaskIndex = path.join(outDir, 'masks');
  if (isMaskIndex(defaultMaskIndex)) directories.push(defaultMaskIndex);

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const localizedMaskIndex = path.join(outDir, entry.name, 'masks');
    if (isMaskIndex(localizedMaskIndex)) directories.push(localizedMaskIndex);
  }

  return directories;
}

function maskCategoryExports(outDir) {
  const exportsByRoute = new Map();
  for (const maskIndexDirectory of maskIndexDirectories(outDir)) {
    for (const entry of fs.readdirSync(maskIndexDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const routeDirectory = path.join(maskIndexDirectory, entry.name);
      if (!fs.existsSync(path.join(routeDirectory, 'index.html'))) continue;

      const route = path.relative(outDir, routeDirectory).split(path.sep).join('/');
      exportsByRoute.set(route, routeDirectory);
    }
  }
  return exportsByRoute;
}

function decodeXmlText(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

export function publishedMaskCategoryRoutes(sitemapXml) {
  const routes = new Set();
  for (const match of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const pathname = new URL(decodeXmlText(match[1])).pathname;
    const segments = pathname.split('/').filter(Boolean);
    const isDefaultRoute = segments.length === 2 && segments[0] === 'masks';
    const isLocalizedRoute = segments.length === 3 && segments[1] === 'masks';
    if (isDefaultRoute || isLocalizedRoute) routes.add(segments.join('/'));
  }
  return routes;
}

export function pruneUnpublishedMaskRoutes(outDir = OUT_DIR) {
  if (!isDirectory(outDir)) {
    throw new Error(`Build output directory not found: ${outDir}`);
  }

  const sitemapPath = path.join(outDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Generated sitemap not found: ${sitemapPath}`);
  }

  const publishedRoutes = publishedMaskCategoryRoutes(fs.readFileSync(sitemapPath, 'utf8'));
  const exportsByRoute = maskCategoryExports(outDir);

  for (const route of publishedRoutes) {
    const routeDirectory = exportsByRoute.get(route);
    if (!routeDirectory) {
      throw new Error(`Published mask category route is missing from the static export: /${route}/`);
    }
    const html = fs.readFileSync(path.join(routeDirectory, 'index.html'), 'utf8');
    if (ROBOTS_NOINDEX_PATTERN.test(html)) {
      throw new Error(`Published mask category route was exported as noindex: /${route}/`);
    }
  }

  const removedRoutes = [];
  for (const [route, routeDirectory] of exportsByRoute) {
    if (publishedRoutes.has(route)) continue;
    fs.rmSync(routeDirectory, { recursive: true });
    removedRoutes.push(`/${route}/`);
  }
  return removedRoutes.sort();
}

function main() {
  const removedRoutes = pruneUnpublishedMaskRoutes();
  console.log(
    removedRoutes.length === 0
      ? 'No unpublished mask category route exports found.'
      : `Removed ${removedRoutes.length} unpublished mask category route exports.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
