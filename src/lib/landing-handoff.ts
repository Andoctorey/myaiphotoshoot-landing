export const LANDING_HANDOFF_PARAMETER = 'ga_handoff';
export const LANDING_HANDOFF_UPDATED = 'landing-handoff-updated';
const STORAGE_KEY = 'landing_ga_handoff';
const MAX_AGE = 24 * 60 * 60 * 1000;
let pending: Promise<void> | undefined;

function consentGranted(): boolean {
  try { return window.localStorage.getItem('consent_choice') === 'accepted'; } catch { return false; }
}

export function readLandingHandoff(): string | null {
  if (typeof window === 'undefined' || !consentGranted()) return null;
  try {
    const token = window.sessionStorage.getItem(STORAGE_KEY);
    if (!token) return null;
    const parts = token.split('~');
    const [version, client, session, capturedAt] = parts;
    const age = Date.now() - Number(capturedAt);
    return parts.length === 4 && version === '1' && /^[A-Za-z0-9._-]{8,128}$/.test(client)
      && /^[1-9][0-9]{0,15}$/.test(session) && Number.isSafeInteger(Number(session))
      && Number.isSafeInteger(Number(capturedAt)) && age >= 0 && age < MAX_AGE
      && Number(session) * 1000 <= Number(capturedAt) && Date.now() - Number(session) * 1000 < MAX_AGE
      ? token : null;
  } catch { return null; }
}

export function prepareLandingHandoff(measurementId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!consentGranted()) {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage can be unavailable. */ }
    window.dispatchEvent(new Event(LANDING_HANDOFF_UPDATED));
    return Promise.resolve();
  }
  if (!window.gtag) return Promise.resolve();
  if (pending) return pending;
  const read = (field: string) => new Promise<unknown>((resolve) => {
    const timeout = setTimeout(() => resolve(undefined), 500);
    window.gtag('get', measurementId, field, (value: unknown) => { clearTimeout(timeout); resolve(value); });
  });
  pending = Promise.all([read('client_id'), read('session_id')]).then(([client, session]) => {
    if (!consentGranted() || typeof client !== 'string' || !/^[A-Za-z0-9._-]{8,128}$/.test(client)
      || !/^[1-9][0-9]{0,15}$/.test(String(session)) || !Number.isSafeInteger(Number(session))) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, `1~${client}~${session}~${Date.now()}`);
      window.dispatchEvent(new Event(LANDING_HANDOFF_UPDATED));
    } catch { /* The app link still works without an analytics handoff. */ }
  }).catch((error: unknown) => {
    console.warn('Loading the landing analytics identity failed', error);
  }).finally(() => { pending = undefined; });
  return pending;
}
