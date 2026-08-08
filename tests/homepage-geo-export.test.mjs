import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'out');
const MAX_PROMPT_SUMMARY_LENGTH = 60;
const HOMEPAGE_GALLERY_KEYS = ['id', 'presetId', 'promptSummary', 'publicUrl'];

function extractInitialItems(rscSource, relativePath) {
  const marker = '"initialItems":';
  const markerIndex = rscSource.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${relativePath} has no initial gallery payload`);

  const arrayStart = rscSource.indexOf('[', markerIndex + marker.length);
  assert.notEqual(arrayStart, -1, `${relativePath} has an invalid initial gallery payload`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < rscSource.length; index += 1) {
    const character = rscSource[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(rscSource.slice(arrayStart, index + 1));
      }
    }
  }

  assert.fail(`${relativePath} has an unterminated initial gallery payload`);
}

test('exported homepage gallery payloads use only compact DTO fields', async () => {
  const localeCodes = (await readdir(path.join(projectRoot, 'messages'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const homepageBases = [
    path.join(outputRoot, 'index'),
    ...localeCodes.map((locale) => path.join(outputRoot, locale, 'index')),
  ];

  for (const homepageBase of homepageBases) {
    const htmlPath = `${homepageBase}.html`;
    const rscPath = `${homepageBase}.txt`;
    const [html, rsc] = await Promise.all([
      readFile(htmlPath, 'utf8'),
      readFile(rscPath, 'utf8'),
    ]);
    const relativeHtmlPath = path.relative(projectRoot, htmlPath);
    const relativeRscPath = path.relative(projectRoot, rscPath);

    assert.doesNotMatch(
      html,
      /(?:"prompt"|\\"prompt\\"|&quot;prompt&quot;)\s*:/,
      `${relativeHtmlPath} contains a serialized full prompt field`,
    );

    const initialItems = extractInitialItems(rsc, relativeRscPath);
    for (const item of initialItems) {
      assert.deepEqual(
        Object.keys(item).sort(),
        HOMEPAGE_GALLERY_KEYS,
        `${relativeRscPath} contains an unexpected gallery field`,
      );
      assert.equal(typeof item.id, 'string', `${relativeRscPath} contains an invalid gallery ID`);
      assert.equal(typeof item.publicUrl, 'string', `${relativeRscPath} contains an invalid gallery URL`);
      assert.equal(
        typeof item.promptSummary,
        'string',
        `${relativeRscPath} contains an invalid prompt summary`,
      );
      assert.ok(
        item.promptSummary.length > 0 && item.promptSummary.length <= MAX_PROMPT_SUMMARY_LENGTH,
        `${relativeRscPath} contains an invalid prompt summary length`,
      );
      assert.ok(
        item.presetId === null || typeof item.presetId === 'string',
        `${relativeRscPath} contains an invalid preset ID`,
      );
    }
  }
});

test('the production export copies llms.txt without adding robots directives', async () => {
  const [source, exported] = await Promise.all([
    readFile(path.join(projectRoot, 'public', 'llms.txt'), 'utf8'),
    readFile(path.join(outputRoot, 'llms.txt'), 'utf8'),
  ]);

  assert.equal(exported, source);

  const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /llms\.txt/i);
});
