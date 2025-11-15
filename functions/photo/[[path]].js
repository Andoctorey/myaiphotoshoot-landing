export async function onRequest(context) {
  // Return 410 Gone for any /photo/* (including /photo) to deindex removed pages
  return new Response('Gone', {
    status: 410,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // Encourage search engines to drop these URLs
      'x-robots-tag': 'noindex, nofollow, noimageindex, noarchive',
      // Allow caching at edge to reduce origin hits
      'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}


