import {
  assignPresetTests,
  experimentConsentAllowed,
  presetTestCookie,
  presetTestConsentCookie,
  presetTestVisitorCookie,
} from './preset-test.js';
import { redirectLegacyPresetRequest } from './_shared/preset-redirects.js';

const UUID_IN_MARKUP = /data-preset-test-id="([0-9a-f-]{36})"/gi;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assignedPresetBanner(html, requestUrl, assignment) {
  if (!UUID.test(assignment?.assignment_id || '') || !previewUrl(assignment?.featured_graphics)) return html;
  if (assignment.cost_credits !== undefined && (!Number.isSafeInteger(assignment.cost_credits) || assignment.cost_credits <= 0)) return html;
  const requested = new URL(requestUrl);
  if (!/^\/(?:(?:[a-z]{2})\/)?presets\/[A-Za-z0-9_-]{1,160}\/?$/.test(requested.pathname)) return html;
  const target = new URL(requested.pathname, 'https://myaiphotoshoot.com');
  target.searchParams.set('assignment_id', assignment.assignment_id);
  for (const key of ['gclid', 'gbraid', 'wbraid', 'dclid', 'utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ttclid', 'fbclid', 'msclkid']) {
    const value = requested.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  const content = `app-id=6744860178, app-argument=${target.href}`.replace(/&/g, '&amp;');
  // Safari can read the banner before hydration resolves the visitor's assigned preview.
  return html.replace(/<meta\b(?=[^>]*\bname=["']apple-itunes-app["'])[^>]*>/i,
    () => `<meta name="apple-itunes-app" content="${content}">`);
}

function previewUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function presetPreviewMarkup(assignments, requestedIds = Object.keys(assignments)) {
  const safe = {};
  const styles = [];
  for (const id of requestedIds) if (UUID.test(id)) safe[id] = null;
  for (const [id, assignment] of Object.entries(assignments)) {
    const url = previewUrl(assignment?.featured_graphics);
    if (!UUID.test(id) || !UUID.test(assignment?.assignment_id || '') || !url) continue;
    safe[id] = assignment;
    const cssUrl = JSON.stringify(url).replace(/</g, '\\3c ');
    const selector = `[data-preset-test-id="${id}"]`;
    styles.push(`${selector} .preset-test-card-media{background-image:url(${cssUrl});background-size:cover;background-position:center}`);
    styles.push(`${selector} .preset-test-card-image{opacity:0}`);
    styles.push(`${selector} .preset-experiment-image-placeholder{background-image:url(${cssUrl});background-size:contain;background-repeat:no-repeat;background-position:center}`);
    styles.push(`${selector} .preset-experiment-image-placeholder rect{opacity:0}`);
  }
  if (!requestedIds.length) return '';
  const data = JSON.stringify(safe).replace(/</g, '\\u003c').replace(/&/g, '\\u0026');
  return `${styles.length ? `<style id="preset-test-preview-style">${styles.join('')}</style>` : ''}<template id="preset-test-bootstrap">${data}</template>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const redirect = redirectLegacyPresetRequest(request);
  if (redirect) return redirect;
  const response = await context.next();
  const consent = presetTestConsentCookie(request);
  if (request.method !== 'GET' || response.status !== 200 ||
      !response.headers.get('content-type')?.includes('text/html') ||
      !experimentConsentAllowed(consent, request.cf?.country) ||
      (!consent && !presetTestCookie(request))) return response;
  const html = await response.text();
  const ids = [...new Set([...html.matchAll(UUID_IN_MARKUP)].map(match => match[1].toLowerCase()))];
  if (!ids.length || ids.length > 50) return new Response(html, response);
  try {
    const result = await assignPresetTests(request, env, ids);
    if (!result.assignments) return new Response(html, response);
    const markup = presetPreviewMarkup(result.assignments, ids);
    if (!markup) return new Response(html, response);
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.set('cache-control', 'private, no-store, max-age=0');
    const vary = headers.get('vary');
    headers.set('vary', vary ? `${vary}, Cookie` : 'Cookie');
    if (result.visitorId) headers.append('set-cookie', presetTestVisitorCookie(result.visitorId));
    const assignedHtml = ids.length === 1 ? assignedPresetBanner(html, request.url, result.assignments[ids[0]]) : html;
    return new Response(assignedHtml.replace(/<\/head>/i, `${markup}</head>`), { status: response.status, headers });
  } catch (error) {
    console.error('Preset preview assignment failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return new Response(html, response);
  }
}
