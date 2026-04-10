/**
 * Cloudflare Pages Function for IndexNow key verification file.
 *
 * Exposes the IndexNow key at:
 * https://myaiphotoshoot.com/indexnow-key.txt
 */

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed. Use GET or HEAD.', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Allow': 'GET, HEAD'
      }
    });
  }

  if (!env.INDEXNOW_KEY) {
    return new Response('INDEXNOW_KEY is not configured', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response(env.INDEXNOW_KEY.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
