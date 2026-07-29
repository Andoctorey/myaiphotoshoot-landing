import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchAiPresetsPage } from '@/lib/ai-presets';
import { withCdnWidth } from '@/lib/image';
import { localePath } from '@/lib/seo';

const HOME_PRESET_EXCLUSIONS = new Set(['minecraft-world', 'spider-man-trains']);

export default async function HomePresets({ locale }: { locale: string }) {
  const [t, presetsPage] = await Promise.all([
    getTranslations({ locale, namespace: 'presets' }),
    fetchAiPresetsPage(locale, 1, 6),
  ]);
  const presets = presetsPage.presets
    .filter((preset) => preset.featured_graphics && !HOME_PRESET_EXCLUSIONS.has(preset.slug))
    .slice(0, 3);

  if (presets.length === 0) return null;

  return (
    <section
      id="presets"
      className="overflow-hidden bg-gray-50 py-12 dark:bg-gray-950 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.4fr)]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
              {t('eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              {t('heading')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
              {t('description')}
            </p>
            <Link
              href={localePath(locale, '/presets/')}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              {t('browsePresets')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-3">
              {presets.map((preset) => (
                <Link
                  key={preset.id}
                  href={localePath(locale, `/presets/${preset.slug}/`)}
                  className="group w-[68vw] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/10 transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-800 lg:w-auto lg:max-w-none"
                >
                  <Image
                    src={withCdnWidth(preset.featured_graphics, 640) || preset.featured_graphics!}
                    alt={preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name })}
                    width={560}
                    height={560}
                    sizes="(max-width: 1023px) 68vw, 24vw"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-950 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
                      {preset.name}
                    </h3>
                    {preset.subtitle ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {preset.subtitle}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
