'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useBlogPosts } from '@/hooks/useBlog';
import { BlogListItem } from '@/types/blog';
import { useLocale, useTranslations } from '@/lib/utils';
import { withDefaultCdnWidth } from '@/lib/image';

// Use stable order to avoid hydration mismatches between SSR/CSR
function takeFirst<T>(items: T[], n: number): T[] { return items.slice(0, n); }

// Simple deterministic PRNG based on a 32-bit seed
function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(arr: T[], seedKey: string): T[] {
  const rand = mulberry32(hashStringToSeed(seedKey));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeBlog({ initialPosts = [] as BlogListItem[] }: { initialPosts?: BlogListItem[] }) {
  const t = useTranslations('blog');
  const locale = useLocale();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initial = (initialPosts && initialPosts.length > 0) ? initialPosts : [];
  const hasFallback = Array.isArray(initial) && initial.length > 0;
  const fallbackData = hasFallback ? {
    posts: takeFirst(initial, 6),
    total: 6,
    page: 1,
    limit: 6,
    totalPages: 1,
  } : undefined;

  const { posts, isLoading, isError } = useBlogPosts({ page: 1, limit: 6, locale, fallbackData });

  const selectedPosts: BlogListItem[] = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    // Daily deterministic shuffle keyed by country (from URL locale) + UTC date
    const utcDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const seed = `${locale}-${utcDate}`;
    return takeFirst(deterministicShuffle(posts, seed), 6);
  }, [posts, locale]);

  if (isError) return null;

  return (
    <section className="pt-16 pb-10 md:pt-24 md:pb-16 bg-white dark:bg-gray-900" id="home-blog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t('title')}
          </h3>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {!isLoading && isClient && selectedPosts.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 mb-10">
            {selectedPosts.map((post, index) => (
              <article
                key={post.id}
                className={`break-inside-avoid bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 mb-6 ${
                  index >= 3 ? 'hidden md:block' : ''
                }`}
              >
                <Link href={`/${locale}/blog/${post.slug}`}>
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700">
                    {post.featured_image_url ? (
                      <Image
                        src={withDefaultCdnWidth(post.featured_image_url) || post.featured_image_url}
                        alt={`Featured image for blog post: ${post.title}`}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {post.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {post.title}
                    </h4>
                    {post.meta_description && (
                      <p className="text-gray-600 dark:text-gray-300">
                        {post.meta_description}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-block px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}


