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

      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const body = await response.text();
      submissions.push({
        batch: i + 1,
        submittedUrls: batches[i].length,
        status: response.status,
        ok: response.ok,
        response: body.slice(0, 500)
      });

      if (!response.ok) {
        return json({
          success: false,
          message: 'IndexNow API rejected submission',
          error: `HTTP ${response.status}`,
          summary: {
            totalUrls: urls.length,
            batchCount: batches.length
          },
          submissions
        }, 502);
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

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
