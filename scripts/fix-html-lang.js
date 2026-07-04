const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
const REDIRECTS_PATH = path.join(OUT_DIR, '_redirects');
const SITEMAP_PATH = path.join(OUT_DIR, 'sitemap.xml');
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
  const match = tag.match(new RegExp(`${attribute}="([^"]+)"`));
  return match ? match[1] : null;
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

function generateBlogAliasRedirects(sitemapXml) {
  // Language switching can create English-slug aliases; redirect them instead of building noindex alias pages.
  const redirects = new Set();
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

      const sourcePath = `/${targetParts.locale}/blog/${englishSlug}`;
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

function appendBlogAliasRedirects() {
  if (!fs.existsSync(SITEMAP_PATH) || !fs.existsSync(REDIRECTS_PATH)) {
    return 0;
  }

  const sitemapXml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const redirects = generateBlogAliasRedirects(sitemapXml);
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

  fs.writeFileSync(REDIRECTS_PATH, `${baseRedirects}\n\n${generatedBlock}\n`);
  return redirects.length;
}

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

const generatedRedirects = appendBlogAliasRedirects();
if (generatedRedirects > 0) {
  console.log(`Added ${generatedRedirects} localized blog alias redirects.`);
}
