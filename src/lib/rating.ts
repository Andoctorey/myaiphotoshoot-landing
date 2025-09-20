/**
 * Deterministically compute a fake rating for a use-case based on its slug.
 * - ratingValue in [4.7, 4.95] with one decimal place (e.g., 4.8, 4.9)
 * - reviewCount in [180, 980]
 */
export function computeFakeRating(slug: string): { ratingValue: string; reviewCount: string } {
  const s = (slug || '').trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  // rating in [4.70, 4.95]
  const ratingFloat = 4.7 + (abs % 26) / 100; // 0..25 -> 0.00..0.25
  const roundedToOne = Math.round(ratingFloat * 10) / 10; // one decimal place
  const ratingValue = roundedToOne.toFixed(1);
  // reviews in [180, 980]
  const reviewCountNum = 180 + (abs % 801); // 0..800
  const reviewCount = String(reviewCountNum);
  return { ratingValue, reviewCount };
}


