import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const revalidate = 3600;

export async function GET() {
  const site = 'https://myaiphotoshoot.com';
  // Default to English feed aggregating all locales' latest posts
  try {
    const locales = ['en','zh','hi','es','de','ja','ru','fr','ar'];
    const limit = 20;
    const fetches = locales.map(async (locale: string) => {
      const resp = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=${limit}&locale=${locale}`, {
        // Cache at the edge for an hour
        next: { revalidate: 3600 },
      });
      if (!resp.ok) return [] as Array<Record<string, unknown>>;
      const data = await resp.json();
      const posts = (data.posts || []) as Array<Record<string, unknown>>;
      return posts.map((p) => ({ ...(p as Record<string, unknown>), locale }));
    });
    const results = await Promise.all(fetches);
    type FeedPost = {
      title: string;
      slug: string;
      created_at: string;
      meta_description?: string | null;
      featured_image_url?: string | null;
      locale: string;
    };

    const posts: FeedPost[] = (results.flat() as Array<Record<string, unknown>>) as unknown as FeedPost[];
    const sorted = posts
      .filter(p => p && p.slug && p.title && p.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    const items = sorted.map((p) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${site}/${p.locale}/blog/${p.slug}</link>
        <guid isPermaLink="true">${site}/${p.locale}/blog/${p.slug}</guid>
        <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
        ${p.meta_description ? `<description><![CDATA[${p.meta_description}]]></description>` : ''}
        ${p.featured_image_url ? `<enclosure url="${p.featured_image_url}" type="image/jpeg" />` : ''}
      </item>
    `).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>My AI Photo Shoot Blog</title>
    <link>${site}</link>
    <description>Latest articles about AI photography and digital art creation.</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=UTF-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}


