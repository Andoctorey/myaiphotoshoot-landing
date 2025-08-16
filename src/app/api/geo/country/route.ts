import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Try Cloudflare/Next headers first
  const countryHeader = request.headers.get('x-vercel-ip-country')
    || request.headers.get('cf-ipcountry')
    || request.headers.get('x-country')
    || '';

  if (countryHeader) {
    return new Response(JSON.stringify({ country: countryHeader }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }

  // Fallback to a fast external IP geolocation if no header is present
  try {
    const res = await fetch('https://ipapi.co/json/', { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({ country: data.country || '' }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    }
  } catch {}

  return new Response(JSON.stringify({ country: '' }), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}


