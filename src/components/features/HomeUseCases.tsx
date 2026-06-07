import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { localePath } from '@/lib/seo';

interface Props {
  initialUseCases?: Array<{ slug: string; title: string; featured_image_urls?: string[] }>;
  locale?: string;
}

export default async function HomeUseCases({ initialUseCases = [], locale = 'en' }: Props) {
  const t = await getTranslations({ locale, namespace: 'navigation' });
  const tSection = await getTranslations({ locale, namespace: 'homeUseCases' });
  const prioritySlugs = [
    'ai-headshot-generator-for-linkedin-resumes-and-team-pages',
    'ai-profile-picture-generator-realistic-headshots-avatars',
    'ai-portrait-generator-for-hyper-realistic-headshots-art',
    'ai-photobooth-hyper-realistic-portraits-headshots',
    'ai-images-of-myself-hyper-realistic-self-portraits',
    'ai-pictures-of-myself-create-hyper-realistic-portraits',
  ];
  const orderedUseCases = [...initialUseCases]
    .sort((a, b) => {
      const aIndex = prioritySlugs.indexOf(a.slug);
      const bIndex = prioritySlugs.indexOf(b.slug);
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex)
        - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    })
    .slice(0, 6);

  return (
    <section id="use-cases" className="py-16 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
            {tSection('eyebrow')}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {tSection('title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {tSection('description')}
          </p>
        </div>

        {orderedUseCases.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">{t('noUseCases')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedUseCases.map((it) => (
              <Link key={it.slug} href={localePath(locale, `/use-cases/${it.slug}/`)} className="block group">
                <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition group-hover:-translate-y-0.5 group-hover:border-purple-200 dark:group-hover:border-purple-700">
                  {Array.isArray(it.featured_image_urls) && it.featured_image_urls[0] && (
                    <Image
                      src={it.featured_image_urls[0]}
                      alt={tSection('imageAlt', { title: it.title })}
                      width={640}
                      height={360}
                      className="w-full h-auto"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:underline">{it.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href={localePath(locale, '/use-cases/')}
            className="inline-flex items-center text-sm font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
          >
            {tSection('exploreAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
