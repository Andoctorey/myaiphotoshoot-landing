import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { onRequest } from './submit-sitemap.js';

const originalFetch = globalThis.fetch;
const submissionToken = 'test-search-submission-token';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('allows only POST requests', async () => {
  const response = await onRequest({
    request: new Request('https://myaiphotoshoot.com/submit-sitemap'),
    env: {
      SEARCH_SUBMISSION_TOKEN: submissionToken
    }
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'POST');
});

test('fails closed when submission authentication is not configured', async () => {
  const response = await onRequest({
    request: submissionRequest(submissionToken),
    env: {}
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.message, 'Sitemap submission authentication is not configured');
});

test('rejects a missing bearer token before accessing Google', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch should not be called');
  };

  const response = await onRequest({
    request: submissionRequest(),
    env: {
      SEARCH_SUBMISSION_TOKEN: submissionToken,
      GOOGLE_SERVICE_ACCOUNT_KEY: '{}'
    }
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
  assert.equal(fetchCalls, 0);
});

test('rejects malformed and incorrect bearer tokens', async () => {
  for (const authorization of ['Basic credentials', 'Bearer ', 'Bearer incorrect-token']) {
    const response = await onRequest({
      request: submissionRequest(undefined, authorization),
      env: {
        SEARCH_SUBMISSION_TOKEN: submissionToken,
        GOOGLE_SERVICE_ACCOUNT_KEY: '{}'
      }
    });

    assert.equal(response.status, 401);
  }
});

test('accepts the configured bearer token before checking Google configuration', async () => {
  const response = await onRequest({
    request: submissionRequest(submissionToken),
    env: {
      SEARCH_SUBMISSION_TOKEN: submissionToken
    }
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.message, 'Google Search Console integration is not configured');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

function submissionRequest(token, authorization) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (authorization !== undefined) {
    headers.Authorization = authorization;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Request('https://myaiphotoshoot.com/submit-sitemap', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'submit-sitemap' })
  });
}
