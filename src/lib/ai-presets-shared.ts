import type { AiPreset } from '@/types/ai-preset';

export const AI_PRESETS_PAGE_SIZE = 12;

export interface AiPresetsPage {
  presets: AiPreset[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function aiPresetsPagePath(page: number): string {
  return page <= 1 ? '/presets/' : `/ai-presets/browse/${page}/`;
}
