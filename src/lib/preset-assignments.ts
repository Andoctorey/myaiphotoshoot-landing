export type PresetAssignment = {
  assignment_id: string;
  featured_graphics: string;
  featured_graphics_alt: string;
  cost_credits?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assignments = new Map<string, PresetAssignment | null>();
let bootstrapRead = false;
let revision = 0;
let inFlight: { promise: Promise<void>; controller: AbortController } | null = null;

function isAssignment(value: unknown): value is PresetAssignment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PresetAssignment>;
  try {
    const url = new URL(item.featured_graphics || '');
    return UUID.test(item.assignment_id || '') && url.protocol === 'https:' &&
      !url.username && !url.password &&
      (item.cost_credits === undefined || (Number.isSafeInteger(item.cost_credits) && item.cost_credits > 0));
  } catch { return false; }
}

function rememberPresetAssignments(values: Record<string, unknown>) {
  for (const [id, value] of Object.entries(values)) {
    if (UUID.test(id) && (value === null || isAssignment(value))) assignments.set(id, value);
  }
}

export function readPresetAssignment(presetId: string): PresetAssignment | null {
  if (!bootstrapRead && typeof document !== 'undefined') {
    bootstrapRead = true;
    const bootstrap = document.getElementById('preset-test-bootstrap');
    const data = (bootstrap as HTMLTemplateElement | null)?.content?.textContent || bootstrap?.textContent;
    if (data) {
      try { rememberPresetAssignments(JSON.parse(data)); }
      catch (error) { console.warn('Invalid preset preview bootstrap', error); }
    }
  }
  return assignments.get(presetId) || null;
}

export function clearPresetAssignments() {
  revision++;
  inFlight?.controller.abort();
  inFlight = null;
  assignments.clear();
  if (typeof document !== 'undefined') {
    document.getElementById('preset-test-preview-style')?.remove();
    document.getElementById('preset-test-bootstrap')?.remove();
  }
}

export function readPresetExperimentConsent(): string {
  // Without readable consent storage, a prior opt-out cannot be ruled out.
  try { return localStorage.getItem('consent_choice') || ''; } catch { return 'rejected'; }
}

export async function resolvePresetAssignments(presetIds: string[]): Promise<void> {
  const requestedRevision = revision;
  let missing: string[];
  while (true) {
    if (requestedRevision !== revision || readPresetExperimentConsent() === 'rejected') return;
    missing = [...new Set(presetIds)].filter((id) => {
      readPresetAssignment(id);
      return !assignments.has(id);
    });
    if (!missing.length) return;
    if (!inFlight) break;
    // Only uncached previews need to wait for the visitor cookie and assignments.
    await inFlight.promise;
  }
  const controller = new AbortController();
  const request = {
    controller,
    promise: fetchAssignments(missing, controller, requestedRevision),
  };
  inFlight = request;
  try {
    await request.promise;
  } finally {
    if (inFlight === request) inFlight = null;
  }
}

async function fetchAssignments(ids: string[], controller: AbortController, requestedRevision: number) {
  const { signal } = controller;
  const controllerTimeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const params = new URLSearchParams({ consent: readPresetExperimentConsent() });
    params.set(ids.length === 1 ? 'presetId' : 'presetIds', ids.join(','));
    const response = await fetch(`/preset-test?${params}`, { cache: 'no-store', signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (signal.aborted || requestedRevision !== revision || readPresetExperimentConsent() === 'rejected') return;
    if (data === null) {
      // Older servers and unresolved consent also return null, without this marker.
      if (response.headers.get('x-preset-test-resolved') === '1') {
        for (const id of ids) assignments.set(id, null);
      }
      return;
    }
    const values = ids.length === 1 ? { [ids[0]]: data } : data;
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Invalid preset previews');
    for (const id of ids) {
      const value = (values as Record<string, unknown>)[id] ?? null;
      if (value !== null && !isAssignment(value)) throw new Error('Invalid preset preview');
    }
    for (const id of ids) assignments.set(id, (values as Record<string, PresetAssignment>)[id] ?? null);
  } finally {
    window.clearTimeout(controllerTimeout);
  }
}
