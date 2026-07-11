const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyCsp,
  buildPolicy,
  getApiOrigin,
  scriptHashes,
} = require('./apply-csp');

test('hashes each distinct inline script and injects CSP before page content', () => {
  const html = '<html><head><script>alert(1)</script></head><body><script>alert(1)</script><script>ok()</script></body></html>';
  const hashes = scriptHashes(html);
  const result = applyCsp(html, 'https://api.example.com');

  assert.equal(hashes.length, 2);
  assert.equal(result.hashCount, 2);
  assert.match(result.html, /^<html><head><meta http-equiv="Content-Security-Policy"/);
  for (const hash of hashes) {
    assert.equal(result.html.includes(hash), true);
  }
});

test('policy blocks arbitrary inline scripts and allows analytics endpoints', () => {
  const policy = buildPolicy('https://api.example.com', ["'sha256-test'"]);

  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  assert.match(policy, /script-src 'self' 'sha256-test'/);
  assert.match(policy, /https:\/\/\*\.google-analytics\.com/);
  assert.match(policy, /https:\/\/\*\.analytics\.google\.com/);
  assert.match(policy, /https:\/\/analytics\.google\.com/);
  assert.match(policy, /https:\/\/\*\.googletagmanager\.com/);
  assert.match(policy, /https:\/\/www\.google\.com/);
  assert.match(policy, /https:\/\/static\.cloudflareinsights\.com/);
  assert.match(policy, /https:\/\/cloudflareinsights\.com/);
});

test('rejects non-HTTPS API URLs', () => {
  assert.throws(
    () => getApiOrigin('http://api.example.com/functions/v1'),
    /must use HTTPS/,
  );
});
