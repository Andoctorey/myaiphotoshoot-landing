export interface AiPresetCatalogEntry {
  id: string;
  slug: string;
  name: string;
  featured_graphics: string | null;
  featured_graphics_alt: string | null;
  created_at: string;
}

export type AiPresetCatalogSort = 'popular' | 'new';

export function aiPresetCatalogPath(locale: string): string {
  return `/preset-catalog/${encodeURIComponent(locale)}`;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isCatalogEntry(value: unknown): value is AiPresetCatalogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<AiPresetCatalogEntry>;
  return typeof entry.id === 'string'
    && Boolean(entry.id.trim())
    && typeof entry.slug === 'string'
    && Boolean(entry.slug.trim())
    && typeof entry.name === 'string'
    && Boolean(entry.name.trim())
    && typeof entry.created_at === 'string'
    && Number.isFinite(Date.parse(entry.created_at))
    && isNullableString(entry.featured_graphics)
    && isNullableString(entry.featured_graphics_alt);
}

export function parseAiPresetCatalog(value: unknown): AiPresetCatalogEntry[] {
  if (!Array.isArray(value) || !value.every(isCatalogEntry)) {
    throw new Error('Preset catalog returned invalid data.');
  }

  const ids = new Set(value.map((entry) => entry.id));
  const slugs = new Set(value.map((entry) => entry.slug));
  if (ids.size !== value.length || slugs.size !== value.length) {
    throw new Error('Preset catalog contained duplicate routes.');
  }
  return value;
}

export function sortAiPresetCatalog(
  catalog: readonly AiPresetCatalogEntry[],
  sort: AiPresetCatalogSort,
): AiPresetCatalogEntry[] {
  if (sort === 'popular') return [...catalog];
  return [...catalog].sort((left, right) => (
    Date.parse(right.created_at) - Date.parse(left.created_at)
    || (left.id < right.id ? 1 : -1)
  ));
}
