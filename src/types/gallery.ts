export interface HomepageGalleryItem {
  id: string;
  publicUrl: string;
  promptSummary: string;
  presetId: string | null;
}

export interface GalleryRandomSession {
  seed: string;
  asOf: string;
}
