import assert from 'node:assert/strict';
import { afterEach, before, test } from 'node:test';

import worker from './deploy-proxy.js';

const originalFetch = globalThis.fetch;
const teamDomain = 'https://example.cloudflareaccess.com';
const keyId = 'test-key';
let privateKey;
let publicJwk;

const baseEnv = {
  DEPLOY_WEBHOOK_URL: 'https://api.cloudflare.com/deploy-hook',
  TEAM_DOMAIN: teamDomain,
  POLICY_AUD: 'admin-app-audience',
  DEPLOY_ALLOWED_EMAILS: 'admin@example.com',
};

before(async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  privateKey = keyPair.privateKey;
  publicJwk = {
    ...await crypto.subtle.exportKey('jwk', keyPair.publicKey),
    alg: 'RS256',
    kid: keyId,
    use: 'sig',
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('rejects requests without a Cloudflare Access assertion before external calls', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch should not be called');
  };

  const response = await worker.fetch(deployRequest(), baseEnv, {});

  assert.equal(response.status, 401);
  assert.equal(await response.text(), 'Missing Cloudflare Access assertion');
  assert.equal(fetchCalls, 0);
});

test('rejects a correctly signed token with the wrong audience', async () => {
  const token = await accessToken({ aud: 'another-application' });
  globalThis.fetch = jwksOnlyFetch();

  const response = await worker.fetch(deployRequest(token), baseEnv, {});

  assert.equal(response.status, 401);
  assert.equal(await response.text(), 'Invalid Cloudflare Access assertion');
});

test('rejects an expired Access token', async () => {
  const token = await accessToken({ exp: Math.floor(Date.now() / 1000) - 120 });
  globalThis.fetch = jwksOnlyFetch();

  const response = await worker.fetch(deployRequest(token), baseEnv, {});

  assert.equal(response.status, 401);
});

test('rejects a token whose signed payload was tampered with', async () => {
  const token = await accessToken();
  const [header, , signature] = token.split('.');
  const tamperedPayload = encodeJson({
    aud: baseEnv.POLICY_AUD,
    email: 'admin@example.com',
    exp: Math.floor(Date.now() / 1000) + 300,
    iss: teamDomain,
    sub: 'different-user',
  });
  globalThis.fetch = jwksOnlyFetch();

  const response = await worker.fetch(
    deployRequest(`${header}.${tamperedPayload}.${signature}`),
    baseEnv,
    {}
  );

  assert.equal(response.status, 401);
});

test('rejects an Access user outside the deploy email allowlist', async () => {
  const token = await accessToken({ email: 'other@example.com' });
  globalThis.fetch = jwksOnlyFetch();

  const response = await worker.fetch(deployRequest(token), baseEnv, {});

  assert.equal(response.status, 403);
});

test('triggers deployment after validating the Access token and email', async () => {
  const token = await accessToken();
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });

    if (url === `${teamDomain}/cdn-cgi/access/certs`) {
      return Response.json({ keys: [publicJwk] });
    }

    if (url === baseEnv.DEPLOY_WEBHOOK_URL) {
      return new Response(null, { status: 200 });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const response = await worker.fetch(deployRequest(token, 'Publish article'), baseEnv, {});
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.success, true);
  assert.equal(result.reason, 'Publish article');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, baseEnv.DEPLOY_WEBHOOK_URL);
});

test('rejects methods other than POST before authentication', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch should not be called');
  };

  const response = await worker.fetch(
    new Request('https://admin.myaiphotoshoot.com/api/deploy'),
    baseEnv,
    {}
  );

  assert.equal(response.status, 405);
  assert.equal(fetchCalls, 0);
});

function jwksOnlyFetch() {
  return async (url) => {
    assert.equal(url, `${teamDomain}/cdn-cgi/access/certs`);
    return Response.json({ keys: [publicJwk] });
  };
}

async function accessToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: 'RS256', kid: keyId, typ: 'JWT' });
  const payload = encodeJson({
    aud: baseEnv.POLICY_AUD,
    email: 'admin@example.com',
    exp: now + 300,
    iat: now,
    iss: teamDomain,
    sub: 'access-user-id',
    ...overrides,
  });
  const signedData = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, signedData);

  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

function encodeJson(value) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function deployRequest(token, reason = 'Test deploy') {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Cf-Access-Jwt-Assertion'] = token;
  }

  return new Request('https://admin.myaiphotoshoot.com/api/deploy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
}
