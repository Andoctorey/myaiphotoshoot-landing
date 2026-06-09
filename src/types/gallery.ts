export interface GalleryItem {
  id: string;
  created_at: string;
  public_url: string;
  prompt: string;
}

export interface GalleryRandomSession {
  seed: string;
  asOf: string;
}
