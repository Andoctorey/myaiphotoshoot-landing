/**
 * Standard cache durations for the application
 */

// Default revalidation time for ISR (1 hour)
export const DEFAULT_REVALIDATE_SECONDS = 3600;

// Frequently updated content (5 minutes)
export const FREQUENT_REVALIDATE_SECONDS = 300;

// Long-lived content (24 hours)
export const LONG_REVALIDATE_SECONDS = 86400;

/**
 * Fetch options with Next.js ISR caching
 * @param duration Duration in seconds for revalidation
 */
export function withRevalidate(duration = DEFAULT_REVALIDATE_SECONDS): { next: { revalidate: number } } {
  return {
    next: { revalidate: duration }
  };
}

/**
 * Fetch options for data that should never be cached
 */
export function noCache(): { cache: 'no-store' } {
  return {
    cache: 'no-store'
  };
} 