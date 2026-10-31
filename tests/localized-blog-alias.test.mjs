import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

test('redirects reported historical blog 404s directly to current canonical URLs', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), { encoding: 'utf8' });
  const lines = redirects.split(/\r?\n/);
  const start = lines.indexOf('# Search Console blog 404s with verified canonical replacements');
  const end = lines.indexOf('# End Search Console blog 404 redirects');
  const rules = lines
    .slice(start + 1, end)
    .filter((line) => line.startsWith('/'))
    .map((line) => {
      const [source, target, status] = line.split(/\s+/);
      return { source, target, status };
    });

  assert.notEqual(start, -1);
  assert.ok(end > start);
  assert.equal(rules.length, 64);
  assert.equal(new Set(rules.map(({ source }) => source)).size, rules.length);
  assert.equal(rules.every(({ status }) => status === '308'), true);

  const rulesBySource = new Map(rules.map(({ source, target }) => [source, target]));
  for (const { source, target } of rules.filter(({ source }) => source.endsWith('/'))) {
    assert.equal(rulesBySource.get(source.slice(0, -1)), target);
  }
  assert.equal(rules.some(({ target }) => rulesBySource.has(target)), false, 'redirect chain detected');

  for (const rule of [
    '/ja/blog/fainaru-garu-horaa-shouzou/ /ja/blog/fainaru-garu-no-horaa-shouzouga/ 308',
    '/blog/boudoir-ideas/ /blog/boudoir-photo-ideas/ 308',
    '/de/blog/boudoir-ideas/ /de/blog/boudoir-foto-ideen/ 308',
    '/ar/blog/afkar-budwar/ /ar/blog/afkar-taswir-budwar/ 308',
    '/blog/retratos-de-vacaciones-en-la-riviera/ /es/blog/retratos-de-vacaciones-en-la-riviera/ 308',
    '/blog/shengri-zhaopian/ /zh/blog/shengri-zhaopian/ 308',
  ]) {
    assert.equal(lines.includes(rule), true, `missing redirect: ${rule}`);
  }
});
