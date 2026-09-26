const DEFAULT_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE = 'preset_test_visitor';
export const CONSENT_COOKIE = 'preset_test_consent';
const CONSENT_COUNTRIES = new Set('AT BE BG HR CY CZ DK EE FI FR DE EL GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB'.split(' '));
const HEADERS = { 'cache-control': 'private, no-store, max-age=0', 'content-type': 'application/json; charset=utf-8', 'x-robots-tag': 'noindex', 'vary': 'Cookie' };

export function experimentConsentAllowed(choice, country) {
  if (choice === 'rejected') return false;
  if (choice === 'accepted') return true;
  return typeof country === 'string' && /^[A-Z]{2}$/.test(country) && country !== 'XX' && !CONSENT_COUNTRIES.has(country);
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
}

async function rpc(env, name, body) {
  const base = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL).replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Preset experiment server credential is missing');
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`Preset experiment RPC ${name} failed: ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function rateLimit(request, env) {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Preset experiment rate limiting is not configured');
  // Store a keyed digest, never the visitor's IP, in the shared rate-limit table.
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`preset-test:${ip}`));
  const subject = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const result = await rpc(env, 'consume_global_rate_limit', { p_subject: `preset-test:${subject}`, p_limit: 60, p_window_seconds: 60 });
  if (typeof result?.allowed !== 'boolean') throw new Error('Invalid preset experiment rate-limit response');
  return result;
}

export function presetTestCookie(request) {
  const saved = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return UUID.test(saved || '') ? saved.toLowerCase() : null;
}

export function presetTestConsentCookie(request) {
  const value = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1);
  return value === 'accepted' || value === 'rejected' ? value : '';
}

export function presetTestVisitorCookie(visitorId) {
  return `${COOKIE}=${visitorId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7776000`;
}

export async function assignPresetTests(request, env, presetIds) {
  if (!Array.isArray(presetIds) || presetIds.length > 50 || presetIds.some(id => !UUID.test(id))) {
    throw new Error('Invalid preset assignment batch');
  }
  const limit = await rateLimit(request, env);
  if (!limit.allowed) return { assignments: null, retryAfter: limit.retry_after_seconds || 60 };
  const visitorId = presetTestCookie(request) || crypto.randomUUID();
  const assignments = await rpc(env, 'assign_ai_preset_tests', {
    p_preset_ids: [...new Set(presetIds)], p_visitor_id: visitorId,
  });
  if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) throw new Error('Invalid preset assignment response');
  return { assignments, visitorId: Object.keys(assignments).length ? visitorId : null };
}

export async function onRequest({ request, env = {} }) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'Forbidden' }, 403);
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json({ error: 'Method Not Allowed' }, 405, { allow: 'GET, POST, DELETE' });
  const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  if (request.method === 'DELETE') return json(null, 200, { 'set-cookie': clearCookie });
  const choice = url.searchParams.get('consent');
  if (presetTestConsentCookie(request) === 'rejected' || !experimentConsentAllowed(choice, request.cf?.country)) {
    return json(null, 200, { 'set-cookie': clearCookie });
  }
  try {
    const savedVisitor = presetTestCookie(request);
    let event;
    if (request.method === 'POST') {
      const text = await request.text();
      if (text.length > 2048) return json({ error: 'Request too large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }
      if (!UUID.test(body?.assignmentId || '') || !['exposure', 'click'].includes(body?.event)) return json({ error: 'Invalid event' }, 400);
      if (!savedVisitor) return json({ error: 'Visitor cookie required' }, 403);
      event = body;
    }
    const presetId = url.searchParams.get('presetId');
    const presetIds = url.searchParams.get('presetIds')?.split(',');
    if (!event && !presetIds && !UUID.test(presetId || '')) return json({ error: 'Invalid preset' }, 400);
    if (!event && presetIds) {
      if (presetIds.length > 50 || presetIds.some(id => !UUID.test(id))) return json({ error: 'Invalid presets' }, 400);
      const batch = await assignPresetTests(request, env, presetIds);
      if (!batch.assignments) return json({ error: 'Too many requests' }, 429, { 'retry-after': String(batch.retryAfter) });
      return json(batch.assignments, 200, batch.visitorId ? { 'set-cookie': presetTestVisitorCookie(batch.visitorId) } : {});
    }
    const limit = await rateLimit(request, env);
    if (!limit.allowed) return json({ error: 'Too many requests' }, 429, { 'retry-after': String(limit.retry_after_seconds || 60) });
    if (event) {
      const recorded = await rpc(env, 'record_ai_preset_test_visitor_event', { p_assignment_id: event.assignmentId, p_visitor_id: savedVisitor, p_event: event.event });
      if (!recorded) return json({ error: 'Assignment unavailable' }, 403);
      return json({ ok: true });
    }
    const visitorId = savedVisitor || crypto.randomUUID();
    const assignment = await rpc(env, 'assign_ai_preset_test', { p_preset_id: presetId, p_visitor_id: visitorId });
    return json(assignment, 200, assignment ? {
      'set-cookie': presetTestVisitorCookie(visitorId),
    } : {});
  } catch (error) {
    console.error('Preset experiment request failed', { method: request.method, error: error instanceof Error ? error.message : 'Unknown error' });
    return json({ error: 'Preset testing is temporarily unavailable' }, 503);
  }
}
