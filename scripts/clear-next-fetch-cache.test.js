const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  clearNextFetchCache,
} = require('./clear-next-fetch-cache');

test('clears only the restored Next.js fetch cache', (t) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'landing-fetch-cache-test-'));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  const fetchCachePath = path.join(projectRoot, '.next', 'cache', 'fetch-cache');
  const webpackCachePath = path.join(projectRoot, '.next', 'cache', 'webpack');
  fs.mkdirSync(fetchCachePath, { recursive: true });
  fs.mkdirSync(webpackCachePath, { recursive: true });
  fs.writeFileSync(path.join(fetchCachePath, 'stale-response.json'), '{}');
  fs.writeFileSync(path.join(webpackCachePath, 'compiler.pack'), 'keep');

  const result = clearNextFetchCache(projectRoot);

  assert.equal(result.existed, true);
  assert.equal(fs.existsSync(fetchCachePath), false);
  assert.equal(fs.existsSync(path.join(webpackCachePath, 'compiler.pack')), true);
});

test('succeeds when the fetch cache was not restored', (t) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'landing-missing-fetch-cache-test-'));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  const result = clearNextFetchCache(projectRoot);

  assert.equal(result.existed, false);
});
