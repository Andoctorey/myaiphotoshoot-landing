import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import PlatformAppLink from './PlatformAppLink';

const showcaseScreenshots = [
  {
    src: '/images/app-showcase/screenshot_1_20260809_123800.webp',
    altKey: 'realisticPhotos',
  },
  {
    src: '/images/app-showcase/screenshot_2_20260809_123800.webp',
    altKey: 'photosOfYou',
  },
  {
    src: '/images/app-showcase/screenshot_3_20260809_123800.webp',
    altKey: 'exploreStyles',
  },
  {
    src: '/images/app-showcase/screenshot_4_20260809_123800.webp',
    altKey: 'photoIdeas',
  },
  {
    src: '/images/app-showcase/screenshot_5_20260809_123800.webp',
    altKey: 'appearanceOptions',
  },
] as const;

export default async function AppShowcase({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'appShowcase' });

  return (
    <section className="overflow-hidden bg-white py-10 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 xl:mx-0 xl:overflow-visible xl:px-0">
          <div className="flex w-max snap-x snap-mandatory gap-4 xl:grid xl:w-full xl:grid-cols-5">
            {showcaseScreenshots.map((screenshot) => (
              <PlatformAppLink
                key={screenshot.src}
                className="group block w-[68vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-2xl border border-purple-200/70 bg-purple-950 shadow-lg shadow-purple-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-4 dark:border-purple-700/50 dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-gray-900 xl:w-auto xl:max-w-none"
                ariaLabel={t(screenshot.altKey)}
              >
                <Image
                  src={screenshot.src}
                  alt={t(screenshot.altKey)}
                  width={645}
                  height={1398}
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
                  sizes="(max-width: 382px) 68vw, (max-width: 1279px) 260px, 240px"
                />
              </PlatformAppLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
