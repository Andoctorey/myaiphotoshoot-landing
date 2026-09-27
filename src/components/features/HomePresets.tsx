import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchAiPresets } from '@/lib/ai-presets';
import { withCdnWidth } from '@/lib/image';
import { localePath } from '@/lib/seo';

const FEATURED_PRESET_IDS = [
  'db8751e2-64e9-4b0c-986d-3661682aa6b7',
  '3bca6079-5551-491c-9c29-73aa87c5ee66',
  '42ed5020-c688-4ae1-a463-931ece93abcb',
  '70b37524-b47f-49dc-a8af-a1e57485822e',
  '8bbf6ee1-c4fb-416d-8cf3-3a9b3b36f326',
  '022e7890-6090-4cdb-9782-f909c2dc7e68',
] as const;
const FALLBACK_PRESET_EXCLUSIONS = new Set(['minecraft-world', 'spider-man-trains']);

export default async function HomePresets({ locale }: { locale: string }) {
  const [t, allPresets] = await Promise.all([
    getTranslations({ locale, namespace: 'presets' }),
    fetchAiPresets(locale),
  ]);
  const presetsById = new Map(allPresets.map((preset) => [preset.id, preset]));
  const featuredPresets = FEATURED_PRESET_IDS.flatMap((id) => {
    const preset = presetsById.get(id);
    return preset?.featured_graphics ? [preset] : [];
  });
  if (featuredPresets.length !== FEATURED_PRESET_IDS.length) {
    const missingIds = FEATURED_PRESET_IDS.filter((id) => !presetsById.get(id)?.featured_graphics);
    console.warn(`Featured presets unavailable for locale "${locale}": ${missingIds.join(', ')}`);
  }
  const featuredIds = new Set<string>(FEATURED_PRESET_IDS);
  const presets = featuredPresets.length === FEATURED_PRESET_IDS.length
    ? featuredPresets
    : [
      ...featuredPresets,
      ...allPresets.filter((preset) => preset.featured_graphics
        && !featuredIds.has(preset.id)
        && !FALLBACK_PRESET_EXCLUSIONS.has(preset.slug)),
    ].slice(0, FEATURED_PRESET_IDS.length);

  if (presets.length === 0) return null;

  return (
    <section
      id="presets"
      className="overflow-hidden bg-gray-50 py-12 dark:bg-gray-950 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.4fr)]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
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
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-brand-900/15 transition hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              {t('browsePresets')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-px lg:grid lg:w-full lg:grid-cols-3">
              {presets.map((preset) => (
                <Link
                  key={preset.id}
                  href={localePath(locale, `/presets/${preset.slug}/`)}
                  aria-label={preset.name}
                  className="group block w-[68vw] max-w-[280px] shrink-0 snap-center min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:w-auto lg:max-w-none"
                >
                  <div className="relative isolate aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <Image
                      src={withCdnWidth(preset.featured_graphics, 640) || preset.featured_graphics!}
                      alt={preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name })}
                      width={560}
                      height={560}
                      sizes="(max-width: 1023px) 68vw, 24vw"
                      className="h-full w-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-48% via-black/20 to-black/80"
                    />
                    <h3 className="absolute inset-x-0 bottom-0 line-clamp-2 p-2 text-base font-bold leading-tight text-white [overflow-wrap:anywhere]">
                      {preset.name}
                    </h3>
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
