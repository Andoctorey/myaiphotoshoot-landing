import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { BlogListItem } from '@/types/blog';
import { withCdnWidth } from '@/lib/image';
import { localePath } from '@/lib/seo';

const HOME_BLOG_COUNT = 6;

// Use stable order to avoid hydration mismatches between SSR/CSR
function takeFirst<T>(items: T[], n: number): T[] { return items.slice(0, n); }

function sortByMostRecent(posts: BlogListItem[]): BlogListItem[] {
  return [...posts].sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

export default async function HomeBlog({
  initialPosts = [],
  locale,
}: {
  initialPosts?: BlogListItem[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  const selectedPosts = takeFirst(sortByMostRecent(initialPosts), HOME_BLOG_COUNT);

  return (
    <section className="overflow-hidden bg-white py-12 dark:bg-gray-900 md:py-16" id="home-blog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
        </div>

        {selectedPosts.length > 0 && (
          <div className="-mx-4 mb-10 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-3 lg:gap-6">
              {selectedPosts.map((post) => (
                <article
                  key={post.id}
                  className="w-[78vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 lg:w-auto lg:max-w-none"
                >
                  <Link className="block h-full" href={localePath(locale, `/blog/${post.slug}/`)}>
                    <div className="aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {post.featured_image_url ? (
                        <Image
                          src={withCdnWidth(post.featured_image_url, 800) || post.featured_image_url}
                          alt={t('imageAlt', { title: post.title })}
                          width={600}
                          height={600}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 1023px) 78vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-brand-300">
                          <span className="text-2xl font-bold text-white">
                            {post.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-gray-900 transition-colors hover:text-primary dark:text-white">
                        {post.title}
                      </h3>
                      {post.meta_description && (
                        <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-300">
                          {post.meta_description}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href={localePath(locale, '/blog/')}
            className="inline-block px-6 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
