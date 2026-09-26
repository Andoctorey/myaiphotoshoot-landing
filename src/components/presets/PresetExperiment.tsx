'use client';

import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import Image, { type ImageProps } from 'next/image';
import { formatCredits } from '@/lib/pricing';

type Assignment = { assignment_id: string; featured_graphics: string; featured_graphics_alt: string; cost_credits?: number };
type ExperimentContext = { appUrl: string; image: string; alt: string; credits: number | null; locale: string; pending: boolean; resolved: boolean; trackClick: () => void };
const Context = createContext<ExperimentContext | null>(null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assignments = new Map<string, Assignment | null>();
let bootstrapRead = false;

export function rememberPresetAssignments(values: Record<string, Assignment | null>) {
  for (const [id, value] of Object.entries(values)) {
    if (UUID.test(id) && value === null) { assignments.set(id, null); continue; }
    try {
      if (value && UUID.test(id) && UUID.test(value.assignment_id) &&
          new URL(value.featured_graphics).protocol === 'https:') assignments.set(id, value);
    } catch { /* Ignore invalid previews. */ }
  }
}

export function readPresetAssignment(presetId: string): Assignment | null {
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

export function isPresetAssignmentResolved(presetId: string): boolean {
  readPresetAssignment(presetId);
  return assignments.has(presetId);
}

export function markPresetAssignmentsChecked(ids: string[]) {
  for (const id of ids) if (UUID.test(id) && !assignments.has(id)) assignments.set(id, null);
}

export function clearPresetAssignments() {
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

async function recordEvent(assignmentId: string, event: 'exposure' | 'click') {
  const consent = readPresetExperimentConsent();
  if (consent === 'rejected') return;
  try {
    const response = await fetch(`/preset-test?consent=${encodeURIComponent(consent)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ assignmentId, event }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) { console.warn('Preset experiment event was not recorded', { event, error }); }
}

export function PresetExperimentProvider({ presetId, appUrl, image, alt, credits, locale, children }: {
  presetId: string; appUrl: string; image: string; alt: string; credits: number | null; locale: string; children: ReactNode;
}) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [pending, setPending] = useState(false);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | undefined;
    const assign = async () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      const choice = readPresetExperimentConsent();
      setAssignment(null);
      setResolved(false);
      if (choice === 'rejected') {
        clearPresetAssignments();
        setPending(false);
        setResolved(true);
        void fetch('/preset-test', { method: 'DELETE' }).catch((error) => console.warn('Unable to clear preset test cookie', error));
        return;
      }
      const preselected = readPresetAssignment(presetId);
      if (preselected) {
        setAssignment(preselected);
        setPending(false);
        setResolved(true);
        return;
      }
      setPending(true);
      const timeout = window.setTimeout(() => current.abort(), 5000);
      try {
        const response = await fetch(`/preset-test?presetId=${encodeURIComponent(presetId)}&consent=${encodeURIComponent(choice)}`, {
          cache: 'no-store', signal: current.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value = await response.json() as Assignment | null;
        if (!value) return;
        if (!UUID.test(value.assignment_id) || new URL(value.featured_graphics).protocol !== 'https:') throw new Error('Invalid test preview');
        if (value.cost_credits !== undefined && (!Number.isSafeInteger(value.cost_credits) || value.cost_credits <= 0)) throw new Error('Invalid test price');
        // Image loading must not select which assigned visitors enter the experiment.
        if (!cancelled && !current.signal.aborted) {
          rememberPresetAssignments({ [presetId]: value });
          setAssignment(value);
        }
      } catch (error) {
        if (!cancelled && !current.signal.aborted) console.warn('Using the original preset preview', error);
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled && controller === current) {
          setPending(false);
          setResolved(true);
        }
      }
    };
    void assign();
    const onConsent = () => { void assign(); };
    const onStorage = (event: StorageEvent) => { if (event.key === 'consent_choice' || event.key === null) onConsent(); };
    window.addEventListener('consent-choice-changed', onConsent);
    window.addEventListener('storage', onStorage);
    return () => { cancelled = true; controller?.abort(); window.removeEventListener('consent-choice-changed', onConsent); window.removeEventListener('storage', onStorage); };
  }, [presetId]);

  useEffect(() => { if (assignment) void recordEvent(assignment.assignment_id, 'exposure'); }, [assignment]);

  return <Context.Provider value={{
    appUrl: assignment ? `${appUrl}~${assignment.assignment_id}` : appUrl,
    image: assignment?.featured_graphics || image,
    alt: assignment?.featured_graphics_alt || alt,
    credits: assignment?.cost_credits ?? credits,
    locale,
    pending,
    resolved,
    trackClick: () => { if (assignment) void recordEvent(assignment.assignment_id, 'click'); },
  }}>{children}</Context.Provider>;
}

export function PresetExperimentLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const context = useContext(Context);
  return <a {...props} href={context?.pending ? undefined : context?.appUrl ?? props.href}
    aria-busy={context?.pending || undefined} aria-disabled={context?.pending || undefined}
    className={`${props.className || ''}${context?.pending ? ' cursor-wait opacity-70' : ''}`}
    onClick={(event) => {
    if (context?.pending) { event.preventDefault(); return; }
    props.onClick?.(event);
    if (!event.defaultPrevented) context?.trackClick();
  }} onAuxClick={(event) => {
    if (context?.pending) { event.preventDefault(); return; }
    props.onAuxClick?.(event);
    if (event.button === 1 && !event.defaultPrevented) context?.trackClick();
  }} />;
}

export function PresetExperimentImage(props: Omit<ImageProps, 'src' | 'alt'>) {
  const context = useContext(Context);
  return context ? <AssignedPresetImage key={context.image} {...props} src={context.image} alt={context.alt} resolved={context.resolved} /> : null;
}

function AssignedPresetImage({ resolved, ...props }: ImageProps & { resolved: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const visible = resolved && loaded;
  return (
    <>
      {!visible && (
        <svg
          aria-hidden="true"
          viewBox="0 0 960 720"
          width="960"
          height="720"
          className={`${props.className || ''} preset-experiment-image-placeholder text-gray-200 dark:text-gray-800`}
        >
          <rect width="960" height="720" fill="currentColor" />
        </svg>
      )}
      <Image
        {...props}
        alt={props.alt}
        className={`${props.className || ''} preset-experiment-image${visible ? '' : ' invisible'}`}
        onLoad={(event) => {
          setLoaded(true);
          props.onLoad?.(event);
        }}
      />
    </>
  );
}

export function PresetExperimentPrice() {
  const context = useContext(Context);
  if (!context?.credits) return null;
  return (
    <span className={`preset-experiment-price inline-flex gap-2${context.resolved ? '' : ' invisible'}`}>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">{formatCredits(context.credits, context.locale)}</span>
    </span>
  );
}
