'use client';

import Image from 'next/image';
import { trackEventAndNavigate } from '@/lib/analytics';
import { usePlatformAppLink } from '@/hooks/usePlatformAppLink';
import { useTranslations } from '@/lib/utils';

const showcaseScreenshots = [
  {
    src: '/images/app-showcase/explore_ai_photo_styles.webp',
    altKey: 'exploreStyles',
  },
  {
    src: '/images/app-showcase/create_realistic_ai_photos.webp',
    altKey: 'realisticPhotos',
  },
  {
    src: '/images/app-showcase/train_your_ai_model.webp',
    altKey: 'trainModel',
  },
  {
    src: '/images/app-showcase/create_photos_of_you.webp',
    altKey: 'photosOfYou',
  },
  {
    src: '/images/app-showcase/find_photo_ideas.webp',
    altKey: 'photoIdeas',
  },
  {
    src: '/images/app-showcase/no_subscription.webp',
    altKey: 'noSubscription',
  },
] as const;

export default function AppShowcase() {
  const appLink = usePlatformAppLink();
  const t = useTranslations('appShowcase');

  return (
    <section className="overflow-hidden bg-white py-10 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-6">
            {showcaseScreenshots.map((screenshot) => (
              <a
                key={screenshot.src}
                href={appLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-[68vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-2xl border border-purple-200/70 bg-purple-950 shadow-lg shadow-purple-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-purple-700/50 lg:w-auto lg:max-w-none"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  trackEventAndNavigate(appLink.event, appLink.url);
                }}
              >
                <Image
                  src={screenshot.src}
                  alt={t(screenshot.altKey)}
                  width={642}
                  height={1389}
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
                  sizes="(max-width: 1023px) 68vw, 16vw"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
