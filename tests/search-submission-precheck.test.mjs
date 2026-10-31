import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function loadPrecheck(script, fetch, abortSignal) {
  const source = readFileSync(new URL(`../scripts/${script}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });

  return runInNewContext(`${outputText}\ncheckSitemapExists;`, {
    require(name) {
      assert.equal(name, 'node-fetch');
      return { default: fetch };
    },
    module: { exports: {} },
    AbortSignal: abortSignal,
    console: { log() {} },
    setTimeout,
  });
}

for (const script of ['submit-indexnow.js', 'submit-sitemap.js']) {
  test(`${script} bounds requests to ten seconds and retries with a fresh signal`, async () => {
    const controllers = new Map();
    const signals = [];
    const check = loadPrecheck(script, async (url, options) => {
      assert.equal(url, 'https://myaiphotoshoot.com/sitemap.xml');
      assert.equal(options.method, 'HEAD');
      assert.ok(controllers.has(options.signal));
      signals.push(options.signal);
      if (signals.length > 1) {
        assert.equal(options.signal.aborted, false);
        return { ok: true };
      }

      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Request timed out')), { once: true });
        queueMicrotask(() => controllers.get(options.signal).abort());
      });
    }, {
      timeout(duration) {
        assert.equal(duration, 10000);
        const controller = new AbortController();
        controllers.set(controller.signal, controller);
        return controller.signal;
      },
    });

    assert.equal(await check(2, 0), true);
    assert.equal(signals.length, 2);
    assert.equal(signals[0].aborted, true);
    assert.notEqual(signals[0], signals[1]);
  });
}
