// Default revalidation time for ISR (1 hour)
const DEFAULT_REVALIDATE_SECONDS = 3600;

/**
 * Fetch options with Next.js ISR caching
 * @param duration Duration in seconds for revalidation
 */
export function withRevalidate(duration = DEFAULT_REVALIDATE_SECONDS): { next: { revalidate: number } } {
  return {
    next: { revalidate: duration }
  };
}
