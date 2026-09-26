'use client';

import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import Image, { type ImageProps } from 'next/image';
import { formatCredits } from '@/lib/pricing';
import {
  clearPresetAssignments,
  readPresetAssignment,
  readPresetExperimentConsent,
  resolvePresetAssignments,
  type PresetAssignment,
} from '@/lib/preset-assignments';

type ExperimentContext = { appUrl: string; image: string; alt: string; credits: number | null; locale: string; pending: boolean; resolved: boolean; trackClick: () => void };
const Context = createContext<ExperimentContext | null>(null);

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
  const [assignment, setAssignment] = useState<PresetAssignment | null>(null);
  const [pending, setPending] = useState(false);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let requestRevision = 0;
    const assign = async () => {
      const current = ++requestRevision;
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
      try {
        await resolvePresetAssignments([presetId]);
        // Image loading must not select which assigned visitors enter the experiment.
        if (!cancelled && requestRevision === current) {
          setAssignment(readPresetAssignment(presetId));
        }
      } catch (error) {
        if (!cancelled && requestRevision === current) console.warn('Using the original preset preview', error);
      } finally {
        if (!cancelled && requestRevision === current) {
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
    return () => { cancelled = true; window.removeEventListener('consent-choice-changed', onConsent); window.removeEventListener('storage', onStorage); };
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
