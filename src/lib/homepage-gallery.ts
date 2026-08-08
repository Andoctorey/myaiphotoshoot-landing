import type { HomepageGalleryItem } from '@/types/gallery';

const MAX_PROMPT_SUMMARY_LENGTH = 60;

export function summarizeGalleryPrompt(prompt: string): string {
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim();
  if (normalizedPrompt.length <= MAX_PROMPT_SUMMARY_LENGTH) return normalizedPrompt;

  return `${normalizedPrompt.slice(0, MAX_PROMPT_SUMMARY_LENGTH - 1).trimEnd()}…`;
}

export function toHomepageGalleryItem(value: unknown): HomepageGalleryItem {
  if (!value || typeof value !== 'object') {
    throw new Error('Gallery item was not an object.');
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const publicUrl = typeof record.public_url === 'string' ? record.public_url.trim() : '';
  const promptSummary = typeof record.prompt === 'string'
    ? summarizeGalleryPrompt(record.prompt)
    : '';
  const presetId = typeof record.preset_id === 'string' ? record.preset_id.trim() : '';

  if (!id || !publicUrl || !promptSummary) {
    throw new Error('Gallery item had invalid required fields.');
  }

  return {
    id,
    publicUrl,
    promptSummary,
    presetId: presetId || null,
  };
}
