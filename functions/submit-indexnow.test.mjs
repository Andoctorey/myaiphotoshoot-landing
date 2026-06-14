import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

const functionSource = await readFile(
  new URL('./submit-indexnow.js', import.meta.url),
  'utf8'
);
const functionModuleUrl = `data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`;
const { onRequest } = await import(functionModuleUrl);

const originalFetch = globalThis.fetch;
const submissionToken = 'test-search-submission-token';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('fails closed when submission authentication is not configured', async () => {
  const response = await onRequest({
    request: submissionRequest(submissionToken),
    env: {
      INDEXNOW_KEY: 'test-indexnow-key'
    }
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.message, 'IndexNow submission authentication is not configured');
});

test('rejects missing and incorrect bearer tokens without outbound requests', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch should not be called');
  };

  for (const authorization of [undefined, 'Basic credentials', 'Bearer ', 'Bearer incorrect-token']) {
    const response = await onRequest({
      request: submissionRequest(undefined, authorization),
      env: {
        SEARCH_SUBMISSION_TOKEN: submissionToken,
        INDEXNOW_KEY: 'test-indexnow-key'
      }
    });

    assert.equal(response.status, 401);
    assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }

  assert.equal(fetchCalls, 0);
});

test('submits only URLs whose hostname exactly matches the configured host', async () => {
  const submittedPayloads = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.indexnow.org/indexnow');
    submittedPayloads.push(JSON.parse(options.body));
    return new Response('', { status: 200 });
  };

  const response = await onRequest({
    request: submissionRequest(submissionToken, undefined, {
      urls: [
        'https://myaiphotoshoot.com/allowed',
        'https://www.myaiphotoshoot.com/rejected',
        'https://example.com/rejected'
      ]
    }),
    env: {
      SEARCH_SUBMISSION_TOKEN: submissionToken,
      INDEXNOW_KEY: 'test-indexnow-key'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(submittedPayloads.length, 1);
  assert.deepEqual(submittedPayloads[0].urlList, [
    'https://myaiphotoshoot.com/allowed'
  ]);
});

function submissionRequest(token, authorization, payload = { action: 'submit-indexnow' }) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (authorization !== undefined) {
    headers.Authorization = authorization;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Request('https://myaiphotoshoot.com/submit-indexnow', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
}
