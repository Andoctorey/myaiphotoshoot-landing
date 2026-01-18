import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { locales } from '@/i18n/request';
import { localePath } from '@/lib/seo';

export const revalidate = 3600;

const buildFunctionsUrl = (path: string, params?: Record<string, string>) => {
  const base = new URL(env.SUPABASE_FUNCTIONS_URL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = base.pathname.replace(/\/$/, '');
  base.pathname = `${basePath}${normalizedPath}`;
  if (params) {
    const searchParams = new URLSearchParams(base.search);
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
    base.search = searchParams.toString();
  }
  return base.toString();
};

export async function GET() {
  const site = 'https://myaiphotoshoot.com';
  // Default to English feed aggregating all locales' latest posts
  try {
    const limit = 20;
    const resp = await fetch(buildFunctionsUrl('/blog-posts', { sitemap: '1' }), {
      next: { revalidate: 3600 },
    });
    if (!resp.ok) {
      return new NextResponse('Not Found', { status: 404 });
    }
    const data = await resp.json();
    const rawPosts = Array.isArray(data.posts) ? data.posts : [];
    type FeedPost = {
      title: string;
      slug: string;
      created_at: string;
      meta_description?: string | null;
      featured_image_url?: string | null;
      locale: string;
    };
    const posts: FeedPost[] = [];
    rawPosts.forEach((post: Record<string, unknown>) => {
      const baseSlug = typeof post.slug === 'string' ? post.slug : null;
      const createdAt = typeof post.created_at === 'string' ? post.created_at : null;
      if (baseSlug && createdAt) {
        posts.push({
          title: typeof post.title === 'string' ? post.title : baseSlug,
          slug: baseSlug,
          created_at: createdAt,
          featured_image_url: typeof post.featured_image_url === 'string' ? post.featured_image_url : null,
          locale: 'en',
        });
      }
      const translations = (post.translations && typeof post.translations === 'object')
        ? (post.translations as Record<string, Record<string, unknown>>)
        : {};
      locales.forEach((locale) => {
        if (locale === 'en') return;
        const translation = translations[locale];
        if (!translation || typeof translation !== 'object') return;
        const translatedSlug = typeof translation.slug === 'string' ? translation.slug : null;
        if (!translatedSlug || !createdAt) return;
        posts.push({
          title: typeof translation.title === 'string' ? translation.title : translatedSlug,
          slug: translatedSlug,
          created_at: createdAt,
          meta_description: typeof translation.meta_description === 'string' ? translation.meta_description : null,
          featured_image_url: typeof post.featured_image_url === 'string' ? post.featured_image_url : null,
          locale,
        });
      });
    });
    const sorted = posts
      .filter(p => p && p.slug && p.title && p.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    const items = sorted.map((p) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${site}${localePath(p.locale, `/blog/${p.slug}/`)}</link>
        <guid isPermaLink="true">${site}${localePath(p.locale, `/blog/${p.slug}/`)}</guid>
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


