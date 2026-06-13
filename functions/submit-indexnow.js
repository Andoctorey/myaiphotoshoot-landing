/**
 * Cloudflare Pages Function for IndexNow URL submission.
 *
 * Submits sitemap URLs to the IndexNow endpoint:
 * https://api.indexnow.org/indexnow
 */

const BASE_URL = 'https://myaiphotoshoot.com';
const HOST = 'myaiphotoshoot.com';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const KEY_LOCATION = `${BASE_URL}/indexnow-key.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10000;
const INDEXNOW_MAX_RETRIES = 3;
const INDEXNOW_BASE_RETRY_DELAY_MS = 1500;
const RETRYABLE_INDEXNOW_STATUSES = new Set([405, 408, 425, 429, 500, 502, 503, 504]);

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST' && request.method !== 'GET') {
    return json({
      success: false,
      message: 'Method not allowed. Use GET for status or POST for submission.'
    }, 405);
  }

  if (!env.INDEXNOW_KEY) {
    return json({
      success: false,
      message: 'INDEXNOW_KEY not found in environment variables',
      instructions: 'Configure INDEXNOW_KEY in Cloudflare Pages settings'
    }, 400);
  }

  if (request.method === 'GET') {
    return json({
      success: true,
      message: 'IndexNow integration ready',
      config: {
        host: HOST,
        sitemapUrl: SITEMAP_URL,
        keyLocation: KEY_LOCATION,
        endpoint: INDEXNOW_ENDPOINT
      },
      instructions: 'POST to this endpoint to submit sitemap URLs via IndexNow'
    });
  }

  try {
    const incomingPayload = await readJsonBody(request);
    const providedUrls = sanitizeUrls(incomingPayload?.urls || []);
    const urls = providedUrls.length > 0 ? providedUrls : await fetchSitemapUrls(SITEMAP_URL);

    if (urls.length === 0) {
      return json({
        success: false,
        message: 'No valid URLs found for IndexNow submission'
      }, 422);
    }

    const batches = chunk(urls, MAX_URLS_PER_BATCH);
    const submissions = [];

    for (let i = 0; i < batches.length; i++) {
      const payload = {
        host: HOST,
        key: env.INDEXNOW_KEY.trim(),
        keyLocation: KEY_LOCATION,
        urlList: batches[i]
      };

      const batchResult = await submitBatchToIndexNow(payload);
      submissions.push({
        batch: i + 1,
        submittedUrls: batches[i].length,
        attempt: batchResult.attempt,
        status: batchResult.status,
        ok: batchResult.ok,
        response: batchResult.response
      });

      if (!batchResult.ok) {
        return json({
          success: false,
          message: 'IndexNow API rejected submission',
          error: `HTTP ${batchResult.status}`,
          summary: {
            totalUrls: urls.length,
            batchCount: batches.length
          },
          submissions
        }, 500);
      }
    }

    return json({
      success: true,
      message: 'IndexNow submission completed successfully',
      summary: {
        totalUrls: urls.length,
        batchCount: batches.length,
        sitemapUrl: SITEMAP_URL,
        keyLocation: KEY_LOCATION
      },
      submissions,
      submittedAt: new Date().toISOString()
    });
  } catch (error) {
    return json({
      success: false,
      message: 'Unexpected error during IndexNow submission',
      error: error?.message || String(error)
    }, 500);
  }
}

function extractLocUrls(xml) {
  const matches = xml.match(/<loc>([\s\S]*?)<\/loc>/gi) || [];

  return matches
    .map((entry) => entry.replace(/<\/?loc>/gi, '').trim())
    .map(decodeXml)
    .filter((url) => isHttpUrl(url));
}

function sanitizeUrls(input) {
  const unique = new Set();

  for (const raw of input) {
    if (typeof raw !== 'string') {
      continue;
    }

    const trimmed = raw.trim();
    if (!isHttpUrl(trimmed)) {
      continue;
    }

    unique.add(trimmed);
  }

  return Array.from(unique);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

async function fetchSitemapUrls(sitemapUrl) {
  const response = await fetch(sitemapUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'MyAIPhotoShoot-IndexNowBot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const urls = extractLocUrls(xml);

  return sanitizeUrls(urls);
}

async function readJsonBody(request) {
  if (request.method !== 'POST') {
    return null;
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

function chunk(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function submitBatchToIndexNow(payload) {
  let last = {
    attempt: 1,
    status: 500,
    ok: false,
    response: 'Unknown error'
  };

  for (let attempt = 1; attempt <= INDEXNOW_MAX_RETRIES; attempt++) {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'myaiphotoshoot.com/1.0 (IndexNowBot)'
      },
      body: JSON.stringify(payload)
    });

    const body = await response.text();
    last = {
      attempt,
      status: response.status,
      ok: response.ok,
      response: body.slice(0, 500)
    };

    if (response.ok) {
      return last;
    }

    const canRetry = RETRYABLE_INDEXNOW_STATUSES.has(response.status) && attempt < INDEXNOW_MAX_RETRIES;
    if (!canRetry) {
      return last;
    }

    const delayMs = INDEXNOW_BASE_RETRY_DELAY_MS * attempt;
    await sleep(delayMs);
  }

  return last;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
