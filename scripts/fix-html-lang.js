const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
const REDIRECTS_PATH = path.join(OUT_DIR, '_redirects');
const SITEMAP_PATH = path.join(OUT_DIR, 'sitemap.xml');
const SITE_ORIGIN = 'https://myaiphotoshoot.com';
const BLOG_ALIAS_REDIRECTS_START = '# Generated localized blog alias redirects';
const BLOG_ALIAS_REDIRECTS_END = '# End generated localized blog alias redirects';
const LOCALE_DIRECTIONS = {
  zh: 'ltr',
  hi: 'ltr',
  es: 'ltr',
  de: 'ltr',
  ja: 'ltr',
  ru: 'ltr',
  fr: 'ltr',
  ar: 'rtl',
};

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield fullPath;
    }
  }
}

function localeForFile(filePath) {
  const relative = path.relative(OUT_DIR, filePath);
  const [firstSegment] = relative.split(path.sep);
  return Object.prototype.hasOwnProperty.call(LOCALE_DIRECTIONS, firstSegment)
    ? firstSegment
    : null;
}

function fixHtmlTag(html, locale) {
  return html.replace(
    /<html\b([^>]*)>/i,
    (_match, attrs) => {
      const withoutLang = attrs
        .replace(/\s+lang=(["']).*?\1/i, '')
        .replace(/\s+dir=(["']).*?\1/i, '');

      return `<html${withoutLang} lang="${locale}" dir="${LOCALE_DIRECTIONS[locale]}">`;
    },
  );
}

function extractAttribute(tag, attribute) {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : null;
}

function decodeXmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function normalizeSiteUrl(value) {
  const url = new URL(decodeXmlEntities(value), SITE_ORIGIN);
  url.hash = '';
  return url.href;
}

function extractAlternateLinks(tags) {
  const links = new Map();
  const duplicates = new Set();
  for (const tag of tags) {
    const rel = extractAttribute(tag, 'rel');
    const hreflang = extractAttribute(tag, 'hreflang');
    const href = extractAttribute(tag, 'href');
    if (rel?.toLowerCase() !== 'alternate' || !hreflang || !href) continue;
    const language = hreflang.toLowerCase();
    if (links.has(language)) duplicates.add(language);
    links.set(language, normalizeSiteUrl(href));
  }
  return { links, duplicates };
}

function buildSitemapBlogHreflangIndex(sitemapXml) {
  const index = new Map();
  const sitemapUrls = new Set();
  const urlBlocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;

    const canonicalUrl = normalizeSiteUrl(loc);
    sitemapUrls.add(canonicalUrl);
    const pathname = new URL(canonicalUrl).pathname;
    if (!/^\/(?:[^/]+\/)?blog\/[^/]+\/$/.test(pathname)) continue;

    const alternateTags = block.match(/<xhtml:link\b[^>]*>/gi) || [];
    index.set(canonicalUrl, extractAlternateLinks(alternateTags));
  }

  return { index, sitemapUrls };
}

function mapsMatch(actual, expected) {
  return actual.size === expected.size
    && Array.from(expected).every(([key, value]) => actual.get(key) === value);
}

function validateBlogHreflang(sitemapXml) {
  const { index, sitemapUrls } = buildSitemapBlogHreflangIndex(sitemapXml);
  const failures = [];
  const seenCanonicalUrls = new Set();
  let checkedCount = 0;

  if (index.size === 0) {
    throw new Error('The sitemap contained no blog article URLs to validate.');
  }

  for (const [canonicalUrl, expected] of index) {
    if (expected.duplicates.size > 0) {
      failures.push(`${canonicalUrl} has duplicate sitemap languages: ${Array.from(expected.duplicates).join(', ')}`);
    }

    for (const targetUrl of expected.links.values()) {
      const target = index.get(targetUrl);
      if (!target || !mapsMatch(target.links, expected.links)) {
        failures.push(`${canonicalUrl} has a non-reciprocal sitemap target: ${targetUrl}`);
        break;
      }
    }
  }

  for (const filePath of walk(OUT_DIR)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const linkTags = html.match(/<link\b[^>]*>/gi) || [];
    const canonicalTag = linkTags.find((tag) => extractAttribute(tag, 'rel')?.toLowerCase() === 'canonical');
    const canonicalHref = canonicalTag ? extractAttribute(canonicalTag, 'href') : null;
    if (!canonicalHref) continue;

    const canonicalUrl = normalizeSiteUrl(canonicalHref);
    const expected = index.get(canonicalUrl);
    if (!expected) continue;

    seenCanonicalUrls.add(canonicalUrl);
    checkedCount += 1;
    const actual = extractAlternateLinks(linkTags);
    const englishUrl = actual.links.get('en');
    const defaultUrl = actual.links.get('x-default');
    const targetsExist = Array.from(actual.links.values()).every((url) => sitemapUrls.has(url));
    if (
      actual.duplicates.size > 0
      || !mapsMatch(actual.links, expected.links)
      || !englishUrl
      || defaultUrl !== englishUrl
      || !targetsExist
    ) {
      failures.push(`${path.relative(OUT_DIR, filePath)} -> ${canonicalUrl}`);
    }
  }

  const missingCanonicalUrls = Array.from(index.keys())
    .filter((canonicalUrl) => !seenCanonicalUrls.has(canonicalUrl));
  if (failures.length > 0 || missingCanonicalUrls.length > 0) {
    const details = [
      ...failures.map((failure) => `Invalid: ${failure}`),
      ...missingCanonicalUrls.map((canonicalUrl) => `Missing export: ${canonicalUrl}`),
    ];
    throw new Error(
      `Exported blog hreflang validation found ${failures.length} invalid entries and `
      + `${missingCanonicalUrls.length} missing sitemap exports:\n${details.slice(0, 10).join('\n')}`,
    );
  }

  return checkedCount;
}

function pathFromAbsoluteUrl(url) {
  return new URL(url).pathname;
}

function localizedBlogPathParts(pathname) {
  const match = pathname.match(/^\/([^/]+)\/blog\/([^/]+)\/?$/);
  if (!match) return null;
  const [, locale, slug] = match;
  if (!Object.prototype.hasOwnProperty.call(LOCALE_DIRECTIONS, locale)) return null;
  return { locale, slug };
}

function encodedBlogPath(locale, slug) {
  return `/${locale}/blog/${encodeURIComponent(slug)}`;
}

function generateBlogAliasRedirects(sitemapXml, legacyLocalizedSlugs = {}) {
  // Static alias rules must stay before splat redirects or Cloudflare counts them against dynamic limits.
  const redirects = new Set();
  const canonicalPathsByLocaleAndEnglishSlug = new Map();
  const urlBlocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(https:\/\/myaiphotoshoot\.com\/blog\/([^/<]+)\/)<\/loc>/);
    if (!locMatch) continue;

    const englishSlug = locMatch[2];
    const alternateTags = block.match(/<xhtml:link\b[^>]*>/g) || [];
    for (const tag of alternateTags) {
      const hreflang = extractAttribute(tag, 'hreflang');
      if (!hreflang || hreflang === 'en' || hreflang === 'x-default') continue;

      const href = extractAttribute(tag, 'href');
      if (!href) continue;

      const targetPath = pathFromAbsoluteUrl(href);
      const targetParts = localizedBlogPathParts(targetPath);
      if (!targetParts || targetParts.slug === englishSlug) continue;

      canonicalPathsByLocaleAndEnglishSlug.set(`${targetParts.locale}:${englishSlug}`, targetPath);

      const sourcePath = `/${targetParts.locale}/blog/${englishSlug}`;
      redirects.add(`${sourcePath} ${targetPath} 308`);
      redirects.add(`${sourcePath}/ ${targetPath} 308`);
    }
  }

  for (const [locale, slugsByLegacySlug] of Object.entries(legacyLocalizedSlugs)) {
    for (const [legacySlug, englishSlug] of Object.entries(slugsByLegacySlug)) {
      const targetPath = canonicalPathsByLocaleAndEnglishSlug.get(`${locale}:${englishSlug}`);
      if (!targetPath) continue;

      const sourcePath = encodedBlogPath(locale, legacySlug);
      if (sourcePath === targetPath || `${sourcePath}/` === targetPath) continue;

      redirects.add(`${sourcePath} ${targetPath} 308`);
      redirects.add(`${sourcePath}/ ${targetPath} 308`);
    }
  }

  return Array.from(redirects).sort();
}

function stripGeneratedBlogAliasRedirects(redirectsContent) {
  const start = redirectsContent.indexOf(BLOG_ALIAS_REDIRECTS_START);
  const end = redirectsContent.indexOf(BLOG_ALIAS_REDIRECTS_END);
  if (start === -1 || end === -1 || end < start) {
    return redirectsContent.trimEnd();
  }

  const before = redirectsContent.slice(0, start).trimEnd();
  const after = redirectsContent.slice(end + BLOG_ALIAS_REDIRECTS_END.length).trim();
  return [before, after].filter(Boolean).join('\n\n');
}

function insertBeforeFirstDynamicRedirect(redirectsContent, generatedBlock) {
  const lines = redirectsContent.split('\n');
  const firstDynamicIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return false;

    const [source] = trimmed.split(/\s+/);
    return source.includes('*') || source.includes(':');
  });

  if (firstDynamicIndex === -1) {
    return `${redirectsContent.trimEnd()}\n\n${generatedBlock}\n`;
  }

  const before = lines.slice(0, firstDynamicIndex).join('\n').trimEnd();
  const after = lines.slice(firstDynamicIndex).join('\n').trimStart();
  return [before, generatedBlock, after].filter(Boolean).join('\n\n') + '\n';
}

async function appendBlogAliasRedirects() {
  if (!fs.existsSync(SITEMAP_PATH) || !fs.existsSync(REDIRECTS_PATH)) {
    return 0;
  }

  // Keep localized blog paths out of _routes.json; Pages Functions prevent _redirects from running.
  const { LEGACY_LOCALIZED_SLUGS } = await import('../functions/_shared/legacy-localized-slugs.js');
  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const redirects = generateBlogAliasRedirects(sitemapXml, LEGACY_LOCALIZED_SLUGS);
  if (redirects.length === 0) {
    return 0;
  }

  const currentRedirects = fs.readFileSync(REDIRECTS_PATH, 'utf8');
  const baseRedirects = stripGeneratedBlogAliasRedirects(currentRedirects);
  const generatedBlock = [
    BLOG_ALIAS_REDIRECTS_START,
    ...redirects,
    BLOG_ALIAS_REDIRECTS_END,
  ].join('\n');

  fs.writeFileSync(REDIRECTS_PATH, insertBeforeFirstDynamicRedirect(baseRedirects, generatedBlock));
  return redirects.length;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    throw new Error(`Build output directory not found: ${OUT_DIR}`);
  }

  let fixedCount = 0;
  for (const filePath of walk(OUT_DIR)) {
    const locale = localeForFile(filePath);
    if (!locale) continue;

    const original = fs.readFileSync(filePath, 'utf8');
    const fixed = fixHtmlTag(original, locale);
    if (fixed !== original) {
      fs.writeFileSync(filePath, fixed);
      fixedCount += 1;
    }
  }

  console.log(`Fixed html lang/dir attributes in ${fixedCount} localized HTML files.`);

  const generatedRedirects = await appendBlogAliasRedirects();
  if (generatedRedirects > 0) {
    console.log(`Added ${generatedRedirects} localized blog alias redirects.`);
  }

  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const validatedCount = validateBlogHreflang(sitemapXml);
  console.log(`Validated hreflang metadata in ${validatedCount} exported blog article pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
