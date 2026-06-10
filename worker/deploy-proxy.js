// Cloudflare Worker Proxy for Landing Page Deployment
// This worker runs behind Cloudflare Access on the admin application's origin.

const DEFAULT_GITHUB_OWNER = 'Andoctorey';
const DEFAULT_GITHUB_REPO = 'myaiphotoshoot-landing';
const DEFAULT_WORKFLOW_ID = 'submit-sitemap.yml';
const DEFAULT_WORKFLOW_REF = 'main';
const MAX_REASON_LENGTH = 200;
const ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion';
const CLOCK_SKEW_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return response('Method not allowed', 405);
    }

    try {
      const authorization = await authorizeRequest(request, env);
      if (!authorization.authorized) {
        return response(authorization.message, authorization.status);
      }

      // Get the deployment webhook URL from environment
      const deployWebhookUrl = env.DEPLOY_WEBHOOK_URL;
      
      if (!deployWebhookUrl) {
        console.error('DEPLOY_WEBHOOK_URL not configured');
        return response('Deployment webhook not configured', 500);
      }

      // Parse the request body to get deployment reason
      let deploymentReason = 'Manual deployment from admin';
      try {
        const requestBody = await request.json();
        if (typeof requestBody.reason === 'string' && requestBody.reason.trim()) {
          deploymentReason = requestBody.reason.trim().slice(0, MAX_REASON_LENGTH);
        }
      } catch (e) {
        // If JSON parsing fails, use default reason
        console.warn('Failed to parse request body, using default reason');
      }

      console.log(`Triggering deployment for user ${authorization.user.id}: ${deploymentReason}`);

      // Forward the request to Cloudflare Pages webhook
      const webhookResponse = await fetch(deployWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deploymentReason,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook request failed:', webhookResponse.status, errorText);
        
        return response(
          `Deployment failed: ${webhookResponse.status} ${webhookResponse.statusText}`,
          webhookResponse.status
        );
      }

      const searchUpdates = await triggerSearchUpdatesWorkflow(env);
      if (searchUpdates.enabled && !searchUpdates.triggered) {
        console.warn('Search update workflow dispatch failed:', searchUpdates.message);
      }

      // Success response
      return response(JSON.stringify({
        success: true,
        message: 'Deployment triggered successfully',
        reason: deploymentReason,
        searchUpdates,
        timestamp: new Date().toISOString(),
      }), 200, 'application/json');

    } catch (error) {
      console.error('Worker error:', error);
      
      return response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), 500, 'application/json');
    }
  },
};

async function authorizeRequest(request, env) {
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) {
    console.error('TEAM_DOMAIN or POLICY_AUD not configured');
    return {
      authorized: false,
      status: 500,
      message: 'Deployment proxy authentication not configured',
    };
  }

  const allowedEmails = parseAllowlist(env.DEPLOY_ALLOWED_EMAILS, true);
  if (allowedEmails.size === 0) {
    console.error('DEPLOY_ALLOWED_EMAILS must be configured');
    return {
      authorized: false,
      status: 500,
      message: 'Deployment proxy authorization not configured',
    };
  }

  const token = request.headers.get(ACCESS_JWT_HEADER);
  if (!token) {
    return {
      authorized: false,
      status: 401,
      message: 'Missing Cloudflare Access assertion',
    };
  }

  let payload;
  try {
    payload = await verifyAccessJwt(token, env);
  } catch (error) {
    console.warn('Cloudflare Access assertion rejected:', error.message);
    return {
      authorized: false,
      status: 401,
      message: 'Invalid Cloudflare Access assertion',
    };
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
  if (!allowedEmails.has(email)) {
    return {
      authorized: false,
      status: 403,
      message: 'User is not authorized to trigger deployments',
    };
  }

  return {
    authorized: true,
    user: {
      id: payload.sub || email,
      email,
    },
  };
}

async function verifyAccessJwt(token, env) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('JWT must contain three segments');
  }

  const header = decodeJwtSegment(parts[0]);
  const payload = decodeJwtSegment(parts[1]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new Error('JWT must use RS256 and include a key ID');
  }

  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN);
  const certsResponse = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!certsResponse.ok) {
    throw new Error(`Unable to load Cloudflare Access keys: HTTP ${certsResponse.status}`);
  }

  const jwks = await certsResponse.json();
  const jwk = Array.isArray(jwks.keys)
    ? jwks.keys.find((key) => key.kid === header.kid && key.kty === 'RSA')
    : undefined;
  if (!jwk) {
    throw new Error('JWT signing key not found');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToBytes(parts[2]);
  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    signedData
  );
  if (!validSignature) {
    throw new Error('JWT signature is invalid');
  }

  validateAccessClaims(payload, teamDomain, env.POLICY_AUD);
  return payload;
}

function validateAccessClaims(payload, expectedIssuer, expectedAudience) {
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== expectedIssuer) {
    throw new Error('JWT issuer is invalid');
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(expectedAudience)) {
    throw new Error('JWT audience is invalid');
  }

  if (typeof payload.exp !== 'number' || payload.exp < now - CLOCK_SKEW_SECONDS) {
    throw new Error('JWT is expired');
  }

  if (typeof payload.nbf === 'number' && payload.nbf > now + CLOCK_SKEW_SECONDS) {
    throw new Error('JWT is not active yet');
  }
}

function decodeJwtSegment(segment) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
  } catch {
    throw new Error('JWT contains invalid JSON');
  }
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function normalizeTeamDomain(value) {
  const url = new URL(
    value.startsWith('https://') || value.startsWith('http://') ? value : `https://${value}`
  );
  if (url.protocol !== 'https:') {
    throw new Error('Cloudflare Access team domain must use HTTPS');
  }
  return url.origin;
}

function parseAllowlist(value, lowercase = false) {
  return new Set(
    String(value || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => lowercase ? entry.toLowerCase() : entry)
  );
}

function response(body, status, contentType = 'text/plain') {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}

async function triggerSearchUpdatesWorkflow(env) {
  const token = env.GITHUB_ACTIONS_TRIGGER_TOKEN;
  if (!token) {
    return {
      enabled: false,
      triggered: false,
      message: 'GitHub workflow trigger is not configured (missing GITHUB_ACTIONS_TRIGGER_TOKEN)'
    };
  }

  const owner = env.GITHUB_OWNER || DEFAULT_GITHUB_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_GITHUB_REPO;
  const workflowId = env.SEARCH_UPDATES_WORKFLOW_ID || DEFAULT_WORKFLOW_ID;
  const ref = env.SEARCH_UPDATES_REF || DEFAULT_WORKFLOW_REF;

  const endpoint =
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'myaiphotoshoot-deploy-proxy',
      },
      body: JSON.stringify({ ref }),
    });

    if (response.status === 204) {
      return {
        enabled: true,
        triggered: true,
        message: `Triggered ${owner}/${repo}:${workflowId} on ${ref}`
      };
    }

    const errorText = await response.text();
    return {
      enabled: true,
      triggered: false,
      status: response.status,
      message: `GitHub workflow dispatch failed with HTTP ${response.status}`,
      error: errorText.slice(0, 500)
    };
  } catch (error) {
    return {
      enabled: true,
      triggered: false,
      message: `GitHub workflow dispatch request failed: ${error.message}`
    };
  }
}
