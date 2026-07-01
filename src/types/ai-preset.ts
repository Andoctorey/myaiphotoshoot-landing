// Public subset of admin Preset plus public.list_ai_presets output.
// Keep in sync with myaiphotoshoot-admin/src/lib/presetService.ts and
// myaiphotoshoot-functions migrations/RPCs that expose ai_presets to the landing site.
export interface AiPreset {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  featured_graphics?: string | null;
  featured_graphics_alt?: string | null;
  cost?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  seo_intro?: string | null;
  seo_sections?: AiPresetSeoSection[] | null;
  faqs?: AiPresetFaq[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  total_count?: number | null;
}

export interface AiPresetSeoSection {
  heading: string;
  body: string[];
}

export interface AiPresetFaq {
  q: string;
  a: string;
}
