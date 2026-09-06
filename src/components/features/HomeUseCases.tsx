import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { withCdnWidth } from '@/lib/image';
import { localePath } from '@/lib/seo';

interface Props {
  initialUseCases?: Array<{ slug: string; title: string; featured_image_urls?: string[] }>;
  locale?: string;
}

export default async function HomeUseCases({ initialUseCases = [], locale = 'en' }: Props) {
  const t = await getTranslations({ locale, namespace: 'navigation' });
  const tSection = await getTranslations({ locale, namespace: 'homeUseCases' });
  const featuredUseCases = [
    {
      slug: 'ai-headshot-generator-for-linkedin-resumes-and-team-pages',
      title: tSection('cards.headshots'),
      imageIndex: 0,
    },
    {
      slug: 'ai-business-headshot-generator-professional-photos',
      title: tSection('cards.business'),
      imageIndex: 0,
    },
    {
      slug: 'ai-linkedin-headshot-generator-professional-profiles',
      title: tSection('cards.linkedin'),
      imageIndex: 2,
    },
    {
      slug: 'ai-dating-profile-picture-generator',
      title: tSection('cards.dating'),
      imageIndex: 0,
    },
    {
      slug: 'ai-profile-picture-generator-realistic-headshots-avatars',
      title: tSection('cards.profiles'),
      imageIndex: 0,
    },
    {
      slug: 'ai-portrait-generator-for-hyper-realistic-headshots-art',
      title: tSection('cards.portraits'),
      imageIndex: 0,
    },
  ];
  const orderedUseCases = featuredUseCases.flatMap((featured) => {
    const useCase = initialUseCases.find((item) => item.slug === featured.slug);
    return useCase ? [{ ...useCase, ...featured }] : [];
  });

  return (
    <section
      id="use-cases"
      className="overflow-hidden bg-gradient-to-b from-gray-50 via-white to-brand-50/40 py-12 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950/20 md:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {tSection('eyebrow')}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {tSection('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            {tSection('description')}
          </p>
        </div>

        {orderedUseCases.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">{t('noUseCases')}</div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-3 lg:gap-6">
              {orderedUseCases.map((it) => {
                const imageUrl = Array.isArray(it.featured_image_urls)
                  ? it.featured_image_urls[it.imageIndex] || it.featured_image_urls[0]
                  : undefined;

                return (
                  <Link
                    key={it.slug}
                    href={localePath(locale, `/use-cases/${it.slug}/`)}
                    className="group block w-[78vw] max-w-[330px] shrink-0 snap-center lg:w-auto lg:max-w-none"
                  >
                    <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-brand-900/10 dark:border-gray-700 dark:bg-gray-800">
                      {imageUrl && (
                        <Image
                          src={withCdnWidth(imageUrl, 800) || imageUrl}
                          alt={tSection('imageAlt', { title: it.title })}
                          width={640}
                          height={480}
                          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width: 1023px) 78vw, 33vw"
                        />
                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                          {it.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href={localePath(locale, '/use-cases/')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-on-primary transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {tSection('exploreAll')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
