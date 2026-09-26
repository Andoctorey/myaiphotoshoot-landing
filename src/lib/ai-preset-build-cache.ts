import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AiPreset } from '@/types/ai-preset';

const CACHE_VERSION = 2;
export const AI_PRESET_REVALIDATE_SECONDS = 3600;
const CACHE_MAX_AGE_MS = AI_PRESET_REVALIDATE_SECONDS * 1000;
const CACHE_DIRECTORY = path.join(process.cwd(), '.next', 'cache', 'ai-preset-content', `v${CACHE_VERSION}`);

type CachedAiPresetSnapshot = {
  version: number;
  revision: string;
  cachedAt: number;
  presets: AiPreset[];
};

const loadedSnapshots = new Map<string, Promise<AiPreset[] | null>>();
let warnedAboutCacheFailure = false;

function warnAboutCacheFailure(operation: string, error: unknown): void {
  if (warnedAboutCacheFailure) return;
  warnedAboutCacheFailure = true;
  console.warn(`AI preset build cache ${operation} failed; continuing without the persistent cache.`, error);
}

function cacheFilePath(locale: string): string {
  const key = createHash('sha256').update(locale).digest('hex');
  return path.join(CACHE_DIRECTORY, `${key}.json`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function presetRevision(preset: AiPreset): string | null {
  const updatedAt = preset.updated_at?.trim();
  const createdAt = preset.created_at?.trim();
  return updatedAt || createdAt || null;
}

function isAiPreset(value: unknown): value is AiPreset {
  if (!isRecord(value)) return false;
  const preset = value as Partial<AiPreset>;
  return typeof preset.id === 'string'
    && Boolean(preset.id.trim())
    && typeof preset.slug === 'string'
    && Boolean(preset.slug.trim())
    && typeof preset.name === 'string'
    && Boolean(preset.name.trim())
    && presetRevision(preset as AiPreset) !== null;
}

function snapshotRevision(presets: AiPreset[]): string {
  const pageContent = presets
    .map((preset) => ({
      id: preset.id,
      slug: preset.slug,
      name: preset.name,
      subtitle: preset.subtitle ?? null,
      featured_graphics: preset.featured_graphics ?? null,
      featured_graphics_alt: preset.featured_graphics_alt ?? null,
      has_active_test: preset.has_active_test === true,
      volume: preset.volume ?? null,
      cost_credits: preset.cost_credits ?? null,
      meta_title: preset.meta_title ?? null,
      meta_description: preset.meta_description ?? null,
      seo_intro: preset.seo_intro ?? null,
      seo_sections: preset.seo_sections ?? null,
      faqs: preset.faqs ?? null,
      created_at: preset.created_at ?? null,
      revision: presetRevision(preset),
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
  return createHash('sha256').update(JSON.stringify(pageContent)).digest('hex');
}

function isSnapshot(value: unknown): value is CachedAiPresetSnapshot {
  if (!isRecord(value) || !Array.isArray(value.presets) || value.presets.length === 0) {
    return false;
  }
  return value.version === CACHE_VERSION
    && typeof value.revision === 'string'
    && typeof value.cachedAt === 'number'
    && value.presets.every(isAiPreset)
    && snapshotRevision(value.presets) === value.revision;
}

async function readCachedSnapshot(locale: string): Promise<CachedAiPresetSnapshot | null> {
  try {
    const cached: unknown = JSON.parse(await readFile(cacheFilePath(locale), 'utf8'));
    if (!isSnapshot(cached)) return null;

    const age = Date.now() - cached.cachedAt;
    return age >= 0 && age <= CACHE_MAX_AGE_MS ? cached : null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT' && !(error instanceof SyntaxError)) {
      warnAboutCacheFailure('read', error);
    }
    return null;
  }
}

export async function storeAiPresetBuildSnapshot(
  locale: string,
  presets: AiPreset[],
): Promise<'reused' | 'written'> {
  if (presets.length === 0 || !presets.every(isAiPreset)) {
    throw new Error(`Cannot cache an invalid AI preset snapshot for locale "${locale}".`);
  }

  const revision = snapshotRevision(presets);
  const current = await readCachedSnapshot(locale);
  if (current?.revision === revision) {
    loadedSnapshots.set(locale, Promise.resolve(presets));
    return 'reused';
  }

  const filePath = cacheFilePath(locale);
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    const cached: CachedAiPresetSnapshot = {
      version: CACHE_VERSION,
      revision,
      cachedAt: Date.now(),
      presets,
    };
    await writeFile(temporaryPath, JSON.stringify(cached));
    await rename(temporaryPath, filePath);
    loadedSnapshots.set(locale, Promise.resolve(presets));
    return 'written';
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    warnAboutCacheFailure('write', error);
    loadedSnapshots.set(locale, Promise.resolve(presets));
    return 'written';
  }
}

export function readAiPresetBuildSnapshot(locale: string): Promise<AiPreset[] | null> {
  const loaded = loadedSnapshots.get(locale);
  if (loaded) return loaded;

  const request = readCachedSnapshot(locale).then((cached) => cached?.presets ?? null);
  loadedSnapshots.set(locale, request);
  void request.then(
    (presets) => {
      if (!presets) loadedSnapshots.delete(locale);
    },
    () => loadedSnapshots.delete(locale),
  );
  return request;
}
