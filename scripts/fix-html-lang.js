const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
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
