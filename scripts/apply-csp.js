const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require('worker_threads');
const { loadEnvConfig } = require('@next/env');

const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const DEFAULT_API_ORIGIN = 'https://trzgfajvyjpvbqedyxug.supabase.co';
const CSP_META_PATTERN = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;
const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const MAX_WORKERS = 4;
const PROGRESS_BATCH_SIZE = 25;
const HASH_CACHE_MAX_ENTRIES = 4096;
const HASH_CACHE_MAX_SCRIPT_LENGTH = 4096;

function getApiOrigin(apiUrl) {
  const url = new URL(apiUrl);
  if (url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL must use HTTPS');
  }
  return url.origin;
}

function hashScript(script, cache) {
  if (!cache || script.length > HASH_CACHE_MAX_SCRIPT_LENGTH) {
    return crypto.createHash('sha256').update(script).digest('base64');
  }

  const cached = cache.get(script);
  if (cached) {
    cache.delete(script);
    cache.set(script, cached);
    return cached;
  }

  const digest = crypto.createHash('sha256').update(script).digest('base64');
  if (cache.size >= HASH_CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(script, digest);
  return digest;
}

function scriptHashes(html, cache) {
  const hashes = new Set();
  for (const match of html.matchAll(INLINE_SCRIPT_PATTERN)) {
    const digest = hashScript(match[1], cache);
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
    `connect-src 'self' ${apiOrigin} https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://*.googletagmanager.com https://www.google.com https://analytics.tiktok.com https://analytics-ipv6.tiktokw.us https://challenges.cloudflare.com https://cloudflareinsights.com`,
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

function applyCsp(html, apiOrigin, cache) {
  if (CSP_META_PATTERN.test(html)) {
    throw new Error('HTML already contains a Content-Security-Policy meta tag');
  }

  const hashes = scriptHashes(html, cache);
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

function processHtmlFiles(filePaths, apiOrigin, onProgress = () => {}) {
  const hashCache = new Map();
  let completedSinceProgress = 0;
  let hashCount = 0;

  for (const filePath of filePaths) {
    const original = fs.readFileSync(filePath, 'utf8');
    const result = applyCsp(original, apiOrigin, hashCache);
    fs.writeFileSync(filePath, result.html);
    hashCount += result.hashCount;
    completedSinceProgress += 1;

    if (completedSinceProgress >= PROGRESS_BATCH_SIZE) {
      onProgress(completedSinceProgress);
      completedSinceProgress = 0;
    }
  }

  if (completedSinceProgress > 0) {
    onProgress(completedSinceProgress);
  }

  return { fileCount: filePaths.length, hashCount };
}

function partitionFiles(filePaths, workerCount) {
  const partitions = Array.from({ length: workerCount }, () => []);
  filePaths.forEach((filePath, index) => {
    partitions[index % workerCount].push(filePath);
  });
  return partitions.filter((partition) => partition.length > 0);
}

function runWorker(filePaths, apiOrigin, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { filePaths, apiOrigin },
    });
    let result = null;
    let settled = false;

    worker.on('message', (message) => {
      if (message.type === 'progress') {
        onProgress(message.count);
      } else if (message.type === 'done') {
        result = message.result;
      }
    });
    worker.on('error', (error) => {
      settled = true;
      reject(error);
    });
    worker.on('exit', (code) => {
      if (settled) return;
      if (code !== 0) {
        reject(new Error(`CSP worker exited with code ${code}`));
      } else if (!result) {
        reject(new Error('CSP worker exited without reporting a result'));
      } else {
        resolve(result);
      }
    });
  });
}

async function applyCspToFiles(filePaths, apiOrigin, options = {}) {
  if (filePaths.length === 0) {
    return { fileCount: 0, hashCount: 0 };
  }

  const availableWorkers = typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
  const workerCount = Math.max(
    1,
    Math.min(options.workerCount || availableWorkers, MAX_WORKERS, filePaths.length),
  );
  let completedCount = 0;
  const onProgress = (count) => {
    completedCount += count;
    options.onProgress?.(completedCount, filePaths.length);
  };

  if (workerCount === 1) {
    return processHtmlFiles(filePaths, apiOrigin, onProgress);
  }

  const results = await Promise.all(
    partitionFiles(filePaths, workerCount)
      .map((partition) => runWorker(partition, apiOrigin, onProgress)),
  );
  return results.reduce(
    (total, result) => ({
      fileCount: total.fileCount + result.fileCount,
      hashCount: total.hashCount + result.hashCount,
    }),
    { fileCount: 0, hashCount: 0 },
  );
}

async function main() {
  loadEnvConfig(ROOT_DIR);

  if (!fs.existsSync(OUT_DIR)) {
    throw new Error(`Build output directory not found: ${OUT_DIR}`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
    || `${DEFAULT_API_ORIGIN}/functions/v1`;
  const apiOrigin = getApiOrigin(apiUrl);
  const filePaths = [...walkHtml(OUT_DIR)];
  const availableWorkers = typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
  const workerCount = Math.max(1, Math.min(availableWorkers, MAX_WORKERS, filePaths.length));
  let lastReportedCount = 0;
  const startedAt = Date.now();

  console.log(`Applying hashed CSP to ${filePaths.length} HTML files with ${workerCount} workers...`);
  const result = await applyCspToFiles(filePaths, apiOrigin, {
    workerCount,
    onProgress: (completedCount, totalCount) => {
      if (completedCount === totalCount || completedCount - lastReportedCount >= 250) {
        console.log(`CSP progress: ${completedCount}/${totalCount} HTML files.`);
        lastReportedCount = completedCount;
      }
    },
  });

  console.log(
    `Applied hashed CSP to ${result.fileCount} HTML files (${result.hashCount} unique page hashes) `
      + `in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`,
  );
}

if (!isMainThread) {
  const result = processHtmlFiles(
    workerData.filePaths,
    workerData.apiOrigin,
    (count) => parentPort.postMessage({ type: 'progress', count }),
  );
  parentPort.postMessage({ type: 'done', result });
} else if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  applyCsp,
  applyCspToFiles,
  buildPolicy,
  getApiOrigin,
  scriptHashes,
};
