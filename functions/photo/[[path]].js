const DEFAULT_FUNCTIONS_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1';
const PHOTO_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTENT_SECURITY_POLICY = "default-src 'none'; img-src https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";
const CTA_COPY = {
  ar: 'إنشاء صورة مثل هذه',
  de: 'Ein ähnliches Foto erstellen',
  en: 'Make one like this',
  es: 'Crear una foto como esta',
  fr: 'Créer une photo comme celle-ci',
  hi: 'ऐसी फ़ोटो बनाएँ',
  ja: 'このような写真を作る',
  ru: 'Создать похожее фото',
  zh: '制作这样的照片',
};

function resolveLocale(request) {
  const requestedLocale = new URL(request.url).searchParams.get('lang');
  const candidates = [requestedLocale, ...(request.headers.get('accept-language') || '').split(',')];
  for (const candidate of candidates) {
    const locale = candidate?.trim().split(';')[0].split('-')[0].toLowerCase();
    if (locale && locale in CTA_COPY) return locale;
  }
  return 'en';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function errorResponse(status, message) {
  return new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}

function renderPhotoPage(photo, locale) {
  const id = escapeHtml(photo.id);
  const imageUrl = escapeHtml(photo.public_url);
  const rawPrompt = typeof photo.prompt === 'string' && photo.prompt.trim()
    ? photo.prompt.trim()
    : 'AI-generated photo';
  const prompt = escapeHtml(rawPrompt);
  const socialDescription = escapeHtml(rawPrompt.slice(0, 180));
  const appUrl = `https://app.myaiphotoshoot.com/#generate/${encodeURIComponent(photo.id)}`;
  const canonicalUrl = `https://myaiphotoshoot.com/photo/${encodeURIComponent(photo.id)}/`;
  const galleryUrl = locale === 'en' ? '/gallery/' : `/${locale}/gallery/`;

  return `<!doctype html>
<html lang="${locale}"${locale === 'ar' ? ' dir="rtl"' : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Make one like this | My AI Photoshoot</title>
  <meta name="description" content="Use this public AI photo as inspiration and create your own version.">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="Make one like this">
  <meta property="og:description" content="${socialDescription}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #f7f3ff; color: #241b2f; }
    header { height: 64px; display: flex; align-items: center; padding: 0 20px; background: rgba(255,255,255,.88); border-bottom: 1px solid #eadff6; }
    header a { color: inherit; font-weight: 700; text-decoration: none; }
    main { width: min(100% - 32px, 760px); margin: 36px auto 64px; }
    .back { display: inline-block; margin-bottom: 18px; color: #6f3aae; text-decoration: none; font-weight: 650; }
    .card { overflow: hidden; border: 1px solid #eadff6; border-radius: 24px; background: #fff; box-shadow: 0 20px 55px rgba(70,39,96,.12); }
    img { display: block; width: 100%; max-height: 72vh; object-fit: contain; background: #eee8f4; }
    .content { padding: 24px; }
    p { margin: 0; color: #62586b; line-height: 1.6; }
    .button { display: flex; justify-content: center; margin-bottom: 22px; padding: 14px 20px; border-radius: 999px; background: #7540b5; color: white; text-decoration: none; font-weight: 750; }
    .button:hover { background: #63329f; }
    @media (prefers-color-scheme: dark) {
      body { background: #16111c; color: #f2eafa; }
      header { background: rgba(25,19,31,.9); border-color: #392c46; }
      .card { background: #211a29; border-color: #392c46; box-shadow: none; }
      img { background: #17121d; }
      p { color: #cbbfd4; }
      .back { color: #c99aff; }
    }
  </style>
</head>
<body>
  <header><a href="/">My AI Photoshoot</a></header>
  <main>
    <a class="back" href="${galleryUrl}">&larr; Back to gallery</a>
    <article class="card" data-photo-id="${id}">
      <img src="${imageUrl}" alt="${prompt}" width="1024" height="1024">
      <div class="content">
        <a class="button" href="${appUrl}">${CTA_COPY[locale]}</a>
        <p>${prompt}</p>
      </div>
    </article>
  </main>
</body>
</html>`;
}

export async function onRequest(context) {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'cache-control': 'no-store',
        allow: 'GET, HEAD',
      },
    });
  }

  const path = Array.isArray(context.params.path)
    ? context.params.path.join('/')
    : String(context.params.path || '');
  const id = path.replace(/^\/+|\/+$/g, '');
  if (!PHOTO_ID_PATTERN.test(id)) {
    return errorResponse(404, 'Photo not found');
  }

  const functionsUrl = context.env.SUPABASE_FUNCTIONS_URL
    || context.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
    || DEFAULT_FUNCTIONS_URL;
  const locale = resolveLocale(context.request);

  try {
    const generationUrl = new URL(`${functionsUrl.replace(/\/$/, '')}/get-generation`);
    generationUrl.search = new URLSearchParams({ id, platform: 'web' }).toString();
    const response = await fetch(generationUrl);
    if (response.status === 404) return errorResponse(404, 'Photo not found');
    if (!response.ok) throw new Error(`get-generation returned ${response.status}`);

    const photo = await response.json();
    if (photo?.id !== id || typeof photo.public_url !== 'string' || !photo.public_url.startsWith('https://')) {
      throw new Error('get-generation returned an invalid public photo');
    }

    return new Response(context.request.method === 'HEAD' ? null : renderPhotoPage(photo, locale), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=3600',
        'x-robots-tag': 'noindex, follow',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'content-security-policy': CONTENT_SECURITY_POLICY,
      },
    });
  } catch (error) {
    console.error('Failed to render public photo page', { id, error });
    return errorResponse(502, 'Unable to load this photo right now');
  }
}
