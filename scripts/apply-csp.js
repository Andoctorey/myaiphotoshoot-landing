const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');

const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const DEFAULT_API_ORIGIN = 'https://trzgfajvyjpvbqedyxug.supabase.co';
const CSP_META_PATTERN = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;
const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;

function getApiOrigin(apiUrl) {
  const url = new URL(apiUrl);
  if (url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL must use HTTPS');
  }
  return url.origin;
}

function scriptHashes(html) {
  const hashes = new Set();
  for (const match of html.matchAll(INLINE_SCRIPT_PATTERN)) {
    const digest = crypto.createHash('sha256').update(match[1]).digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes].sort();
}

function buildPolicy(apiOrigin, hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')} https://*.googletagmanager.com https://analytics.tiktok.com https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${apiOrigin} https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://*.googletagmanager.com https://www.google.com https://analytics.tiktok.com https://challenges.cloudflare.com https://cloudflareinsights.com`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function applyCsp(html, apiOrigin) {
  if (CSP_META_PATTERN.test(html)) {
    throw new Error('HTML already contains a Content-Security-Policy meta tag');
  }

  const hashes = scriptHashes(html);
  const policy = buildPolicy(apiOrigin, hashes);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(policy)}"/>`;

  if (!/<head>/i.test(html)) {
    throw new Error('HTML document does not contain a head element');
  }

  return {
    html: html.replace(/<head>/i, `<head>${meta}`),
    hashCount: hashes.length,
  };
}

function* walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtml(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield fullPath;
    }
  }
}

function main() {
  loadEnvConfig(ROOT_DIR);

  if (!fs.existsSync(OUT_DIR)) {
    throw new Error(`Build output directory not found: ${OUT_DIR}`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
    || `${DEFAULT_API_ORIGIN}/functions/v1`;
  const apiOrigin = getApiOrigin(apiUrl);
  let fileCount = 0;
  let hashCount = 0;

  for (const filePath of walkHtml(OUT_DIR)) {
    const original = fs.readFileSync(filePath, 'utf8');
    const result = applyCsp(original, apiOrigin);
    fs.writeFileSync(filePath, result.html);
    fileCount += 1;
    hashCount += result.hashCount;
  }

  console.log(`Applied hashed CSP to ${fileCount} HTML files (${hashCount} unique page hashes).`);
}

if (require.main === module) {
  main();
}

module.exports = {
  applyCsp,
  buildPolicy,
  getApiOrigin,
  scriptHashes,
};
