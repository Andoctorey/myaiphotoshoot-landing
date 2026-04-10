#!/usr/bin/env node

/**
 * Auto-submit sitemap URLs to IndexNow via Cloudflare Pages Function.
 */

const SITEMAP_URL = 'https://myaiphotoshoot.com/sitemap.xml';
const SUBMIT_URL = 'https://myaiphotoshoot.com/submit-indexnow';

async function checkSitemapExists(maxRetries = 5, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fetch = (await import('node-fetch')).default;
      console.log(`Checking sitemap availability (attempt ${i + 1}/${maxRetries})...`);

      const response = await fetch(SITEMAP_URL, {
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'MyAIPhotoShoot-IndexNowBot/1.0'
        }
      });

      if (response.ok) {
        console.log('Sitemap is accessible.');
        return true;
      }

      console.log(`Sitemap not ready (${response.status}), retrying in ${delayMs / 1000}s...`);
    } catch (error) {
      console.log(`Sitemap check failed: ${error.message}, retrying in ${delayMs / 1000}s...`);
    }

    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log('Sitemap not accessible after retries.');
  return false;
}

async function submitIndexNow() {
  const fetch = (await import('node-fetch')).default;

  const response = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MyAIPhotoShoot-Deploy/1.0'
    },
    body: JSON.stringify({
      action: 'submit-indexnow',
      timestamp: new Date().toISOString()
    })
  });

  const text = await response.text();
  let parsed = null;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed?.success) {
    const message = parsed?.message || `HTTP ${response.status}`;
    throw new Error(`IndexNow submission failed: ${message}`);
  }

  const totalUrls = parsed?.summary?.totalUrls;
  const batches = parsed?.summary?.batchCount;
  console.log(`IndexNow submission successful. URLs: ${totalUrls ?? 'unknown'}, batches: ${batches ?? 'unknown'}.`);
}

async function main() {
  console.log('Starting IndexNow submission flow...');

  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const waitTime = isGitHubActions ? 5000 : 10000;
  console.log(`Waiting ${waitTime / 1000} seconds for deployment to settle...`);
  await new Promise((resolve) => setTimeout(resolve, waitTime));

  const sitemapAccessible = await checkSitemapExists();
  if (!sitemapAccessible) {
    console.log('Continuing submission attempt even though sitemap precheck failed.');
  }

  await submitIndexNow();
  console.log('IndexNow flow completed.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
