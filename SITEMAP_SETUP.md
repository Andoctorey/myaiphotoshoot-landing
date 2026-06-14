# Automated Search Engine Submission Setup

This guide explains how automated search-engine submission works and how to configure it properly.

## Architecture Overview

The system consists of five components:

1. **Google submission function** (`functions/submit-sitemap.js`)
   - Handles Google Search Console API authentication and sitemap submission.
   - Requires Bearer authentication before using the Google service account.
   - Uses encrypted Cloudflare Pages secrets for credentials.

2. **IndexNow submission function** (`functions/submit-indexnow.js`)
   - Fetches URLs from `sitemap.xml` and submits them to `https://api.indexnow.org/indexnow`.
   - Supports batching when URL count is larger than the IndexNow per-request limit.

3. **IndexNow key file function** (`functions/indexnow-key.txt.js`)
   - Exposes the key verification file at `https://myaiphotoshoot.com/indexnow-key.txt`.
   - Returns `INDEXNOW_KEY` as plain text.

4. **Submission scripts** (`scripts/submit-sitemap.js`, `scripts/submit-indexnow.js`)
   - Call the Cloudflare Pages Functions with retries and deployment-delay handling.
   - Provide deployment-friendly logs and non-interactive execution.

5. **GitHub Actions workflow** (`.github/workflows/submit-sitemap.yml`)
   - Automatically triggers after pushes to `main`/`master`.
   - Runs both Google and IndexNow submissions after deployment wait time.

## Configuration Steps

### 1. Google Search Console Setup

1. Create or choose a Google Cloud project.
2. Enable **Search Console API**.
3. Create a service account and generate a JSON key.
4. Add the service account email as a **Full user** in Google Search Console for `myaiphotoshoot.com`. Full users can submit sitemaps; Owner access is not required.
5. In Cloudflare Pages, add `GOOGLE_SERVICE_ACCOUNT_KEY` as an encrypted secret containing the full JSON key.
6. Generate a high-entropy submission token, for example:

```bash
openssl rand -hex 32
```

7. Add that token as an encrypted Cloudflare Pages secret named `SEARCH_SUBMISSION_TOKEN`.
8. Add the same token as a GitHub Actions repository secret named `SEARCH_SUBMISSION_TOKEN`.

The Cloudflare and GitHub secret values must match. Do not store either value in source control.

### 2. IndexNow Setup

1. Generate an IndexNow key (8-128 chars, letters/numbers/hyphen).
2. In Cloudflare Pages, set environment variable `INDEXNOW_KEY` to that value.
3. Deploy the site; the key file endpoint will be available at:
   - `https://myaiphotoshoot.com/indexnow-key.txt`
4. Confirm endpoint output exactly matches your key.

### 3. Cloudflare Pages Functions

After deploy, verify these endpoints:

- `https://myaiphotoshoot.com/submit-sitemap` (authenticated Google submission)
- `https://myaiphotoshoot.com/submit-indexnow` (authenticated IndexNow status/submission)
- `https://myaiphotoshoot.com/indexnow-key.txt` (IndexNow key verification file)

### 4. GitHub Actions Workflow

The existing workflow now:

- waits 130 seconds for deployment completion,
- submits authenticated sitemap updates to Google Search Console,
- submits authenticated sitemap URLs through IndexNow,
- checks the authenticated IndexNow status endpoint.

## How It Works

### Deployment Flow

1. Push code to GitHub (`main`/`master`).
2. Cloudflare Pages builds and deploys the site.
3. GitHub Actions waits for deployment to settle.
4. `scripts/submit-sitemap.js` calls `/submit-sitemap`.
5. `scripts/submit-indexnow.js` calls `/submit-indexnow`.
6. Workflow logs the Google submission result and the authenticated IndexNow status response.

## Manual Testing

```bash
# Google submission
curl -X POST "https://myaiphotoshoot.com/submit-sitemap" \
  -H "Authorization: Bearer ${SEARCH_SUBMISSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"action": "submit-sitemap"}'

# IndexNow endpoint status
curl -X GET "https://myaiphotoshoot.com/submit-indexnow" \
  -H "Authorization: Bearer ${SEARCH_SUBMISSION_TOKEN}"

# IndexNow submission
curl -X POST "https://myaiphotoshoot.com/submit-indexnow" \
  -H "Authorization: Bearer ${SEARCH_SUBMISSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"action": "submit-indexnow"}'

# IndexNow key file
curl -X GET "https://myaiphotoshoot.com/indexnow-key.txt"

# Run scripts locally
SEARCH_SUBMISSION_TOKEN="your-token" node scripts/submit-sitemap.js
SEARCH_SUBMISSION_TOKEN="your-token" node scripts/submit-indexnow.js
```

`GET /submit-sitemap` is intentionally disabled. Both submission endpoints return `401` when the Bearer token is missing or invalid and fail with `500` when server-side authentication is not configured.

## Troubleshooting

### Common Issues

1. **Google key missing / invalid**
   - Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is present and valid JSON.

2. **Google submission returns `401`**
   - Verify the request sends `Authorization: Bearer <token>`.
   - Verify the Cloudflare and GitHub `SEARCH_SUBMISSION_TOKEN` secrets have identical values.

3. **Google submission authentication is not configured**
   - Add `SEARCH_SUBMISSION_TOKEN` as an encrypted Cloudflare Pages secret and redeploy.

4. **IndexNow key missing**
   - Verify `INDEXNOW_KEY` exists in Cloudflare Pages environment variables.

5. **IndexNow key verification mismatch**
   - `https://myaiphotoshoot.com/indexnow-key.txt` must return exactly the same value as `INDEXNOW_KEY`.

6. **Sitemap unavailable**
   - Wait longer for deployment propagation.
   - Confirm `https://myaiphotoshoot.com/sitemap.xml` returns `200`.

7. **IndexNow API rejection**
   - Ensure submitted URLs are valid for `myaiphotoshoot.com`.
   - Verify endpoint connectivity and retry on transient errors.

### Debugging Steps

1. Check GitHub Actions logs in the Actions tab.
2. Test all three Cloudflare endpoints directly.
3. Confirm sitemap availability via:

```bash
curl -I "https://myaiphotoshoot.com/sitemap.xml"
```

## Monitoring

### Success Indicators

- GitHub Actions workflow completes successfully.
- Authenticated `POST /submit-sitemap` and `POST /submit-indexnow` return `success: true`.
- `indexnow-key.txt` serves the configured key.
- New pages appear in Google Search Console and IndexNow-enabled engines faster.

### Log Locations

- **GitHub Actions**: Repository Actions tab
- **Cloudflare Pages**: Functions logs
- **Google Search Console**: Sitemaps section

## Security Notes

- Keep `GOOGLE_SERVICE_ACCOUNT_KEY` and `SEARCH_SUBMISSION_TOKEN` in encrypted Cloudflare Pages secrets.
- Keep `SEARCH_SUBMISSION_TOKEN` in GitHub Actions secrets.
- Keep `INDEXNOW_KEY` in Cloudflare configuration; it is intentionally exposed through the IndexNow verification endpoint.
- Do not store service account JSON in source control.
- IndexNow keys are expected to be publicly verifiable via the key file endpoint.

## Benefits

- Faster indexing coverage across Google and IndexNow-enabled engines.
- Fully automated post-deploy notification flow.
- Graceful fallback: site stays fully operational even if submission calls fail.

## Support

If submissions fail:

1. check workflow logs,
2. verify endpoint responses manually,
3. verify Cloudflare environment variables,
4. confirm Search Console ownership and IndexNow key output.

Even if submission steps fail, search engines can still discover content through regular crawling and `robots.txt` sitemap discovery.
