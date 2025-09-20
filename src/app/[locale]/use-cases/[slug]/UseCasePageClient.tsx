'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import PhotoCard from '@/components/features/PhotoCard';
import FAQSchema from '@/components/blog/FAQSchema';
import { useUseCase } from '@/hooks/useUseCase';
import { useTranslations } from '@/lib/utils';
import type { UseCase } from '@/types/usecase';
import { withDefaultCdnWidth } from '@/lib/image';
import UseCaseProductJsonLd from '@/components/seo/UseCaseProductJsonLd';
import { canonicalUrl } from '@/lib/seo';
import { computeFakeRating } from '@/lib/rating';

interface Props {
  slug: string;
  locale: string;
  initialUseCase?: UseCase;
}

export default function UseCasePageClient({ slug, locale, initialUseCase }: Props) {
  const { useCase, isLoading } = useUseCase({ slug, locale, fallbackData: initialUseCase });
  const tPricing = useTranslations('pricing');
  const tUseCase = useTranslations('useCase');
  const tNav = useTranslations('navigation');
  const tDownload = useTranslations('download');
  const tFAQ = useTranslations('faq');
  // Hooks must be declared unconditionally at the top of the component
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const sectionsLength = ((useCase?.sections || useCase?.translations?.[locale]?.sections || []) as Array<{ heading: string; body: string[] }>).
    filter(s => s.heading !== 'How It Works').length;
  useEffect(() => {
    const observers: ResizeObserver[] = [];
    textRefs.current.forEach((el, idx) => {
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        const rect = entries[0]?.contentRect;
        if (!rect) return;
        setRowHeights(prev => {
          const next = [...prev];
          next[idx] = Math.ceil(rect.height);
          return next;
        });
      });
      ro.observe(el);
      observers.push(ro);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [sectionsLength]);

  if (isLoading && !useCase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">{tUseCase('loading')}</div>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">{tUseCase('notFound')}</div>
    );
  }

  const t = useCase.translations?.[locale] || useCase.translations?.['en'];
  const title = useCase.title || t?.title || useCase.slug || 'Use case';
  const sectionsRaw = useCase.sections || t?.sections || [];
  const sections = (sectionsRaw || []).filter(s => s.heading !== 'How It Works');
  const galleryRaw = useCase.gallery_photos || [];
  const gallery = Array.from(new Map((galleryRaw || []).filter(g => g && g.url).map(g => [g.url, g])).values());
  const faqs = useCase.faqs || t?.faqs || [];
  const description = useCase.meta_description || t?.meta_description || '';
  const sectionSpacing = "mt-12 md:mt-16";
  const { ratingValue, reviewCount } = computeFakeRating(slug);

  const featured = Array.isArray(useCase.featured_image_urls)
    ? (useCase.featured_image_urls as string[]).filter(Boolean)
    : [];
  const headerImageUrl = featured[0] || undefined;
  const perSectionPool = featured.length > 1 ? featured.slice(1) : [];
  // Exclude featured photos from the marquee gallery
  const normalizeUrl = (u?: string) => {
    const s = (u || '').trim();
    if (!s) return '';
    // strip CDN image resize wrapper like /cdn-cgi/image/.../https://
    const unwrapped = s.replace(/\/cdn-cgi\/image\/[^/]+\/(https?:\/\/)/, '$1');
    // drop query/hash
    return unwrapped.split('?')[0].split('#')[0];
  };
  const featuredUrlSet = new Set(featured.map(normalizeUrl));
  // Also exclude any image used on the page (header + per-section images)
  const usedOnPageUrlSet = new Set([
    normalizeUrl(headerImageUrl),
    ...perSectionPool.map(normalizeUrl)
  ].filter(Boolean) as string[]);
  const marqueeGallery = (gallery || []).filter(g => {
    const url = normalizeUrl(g.url || '');
    return g && g.url && !featuredUrlSet.has(url) && !usedOnPageUrlSet.has(url);
  });


  return (
    <article className="max-w-5xl mx-auto px-4 pt-6 sm:pt-10 pb-36 sm:pb-14">
      {/* Product JSON-LD for this use-case */}
      <UseCaseProductJsonLd
        idUrl={canonicalUrl(locale, `/use-cases/${slug}/`)}
        name={title}
        description={description}
        imageUrls={featured}
        ratingValue={ratingValue}
        reviewCount={reviewCount}
      />
      {/* SEO Schema for FAQ */}
      {faqs.length > 0 && (
        <FAQSchema faqs={faqs.map(f => ({ question: f.q, answer: f.a }))} />
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <ol className="flex items-center gap-1 flex-wrap">
          <li><a href={`/${locale}/`} className="hover:text-gray-700 dark:hover:text-gray-200">{tNav('home')}</a></li>
          <li>/</li>
          <li><a href={`/${locale}/use-cases/`} className="hover:text-gray-700 dark:hover:text-gray-200">{tUseCase('breadcrumb.useCases')}</a></li>
          <li>/</li>
          <li aria-current="page" className="text-gray-700 dark:text-gray-200">{title}</li>
        </ol>
      </nav>
      <header className="mb-4">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
            )}
            {/* Inline pricing under description */}
            <div className="mt-3 text-base text-gray-900 dark:text-gray-100">
              <span className="font-semibold">{tPricing('price')} {tPricing('perPhoto')}</span>
              <span className="mx-2 text-gray-400">·</span>
              <span>{tPricing('oneTimeFeeAmount')} <span className="text-gray-600 dark:text-gray-300">({tPricing('oneTimeFee')})</span></span>
            </div>
            {/* Conversion highlights */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M7.5 2.25l.77 2.36c.17.53.63.9 1.18.95l2.49.19-1.92 1.43c-.45.33-.64.9-.48 1.44l.74 2.41-1.98-1.36a1.25 1.25 0 00-1.43 0L5.4 11.03l.74-2.41c.16-.54-.03-1.11-.48-1.44L3.74 5.75l2.49-.19c.55-.04 1.01-.42 1.18-.95L7.5 2.25z"/>
                </svg>
                {tUseCase('badges.cheapest')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 dark:border-green-900/40 bg-green-50/70 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-2.34a.75.75 0 10-1.06-1.06l-4.5 4.5-1.44-1.44a.75.75 0 10-1.06 1.06l1.97 1.97a.75.75 0 001.06 0l5.03-5.03z" clipRule="evenodd"/>
                </svg>
                {tUseCase('badges.noSubscription')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-900/40 bg-purple-50/70 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path d="M11.48 3.5a.75.75 0 011.04-.02l6 5.5a.75.75 0 11-1.02 1.1L12.75 5.1v14.15a.75.75 0 11-1.5 0V5.1L6.5 10.08a.75.75 0 01-1.02-1.1l6-5.5z"/>
                </svg>
                {tUseCase('badges.poweredByFlux')}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <a
                href="https://app.myaiphotoshoot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transform hover:scale-105 transition duration-150 block w-full sm:w-auto"
                aria-label={tDownload('webApp.button')}
              >
                <span className="inline-flex items-center justify-center h-[56px] px-6 rounded-[10px] bg-black text-white border border-white/70 w-full sm:w-auto">
                  <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>{tDownload('webApp.button')}</span>
                </span>
              </a>
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                <a
                  href={'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=usecase&medium=cta&campaign=' + encodeURIComponent(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition duration-150"
                  aria-label={tDownload('mobileApps.googlePlay')}
                >
                  <Image alt={tDownload('mobileApps.googlePlay')} src='/images/google-play-badge.svg' width={202} height={56} className="h-12 sm:h-[56px] w-auto object-contain" />
                </a>
                <a
                  href="https://apps.apple.com/app/id6744860178"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition duration-150"
                  aria-label={tDownload('mobileApps.appStore')}
                >
                  <Image alt={tDownload('mobileApps.appStore')} src='/images/app-store-badge.svg' width={202} height={56} className="h-12 sm:h-[56px] w-auto object-contain" />
                </a>
              </div>
            </div>
          </div>
          {headerImageUrl && (
            <div className="hidden sm:block shrink-0 w-48 md:w-60">
              <Image
                src={headerImageUrl}
                alt=""
                width={0}
                height={0}
                sizes="(min-width:768px) 240px, 192px"
                style={{ width: '100%', height: 'auto' }}
                className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {marqueeGallery.length > 0 && (
        <section className="mt-6">
          {(slug === 'ai-headshots' || slug === 'ai-headshot-generator-for-linkedin-resumes-and-team-pages') && (
            <p className="mb-3 text-sm text-center text-gray-500 dark:text-gray-400">
              {tUseCase('galleryDisclaimer')}
            </p>
          )}
          <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-hidden">
            <div className="overflow-hidden bg-white dark:bg-gray-900">
              <div className="usecase-marquee-container">
                <div className="usecase-marquee-track-single">
                {[...marqueeGallery, ...marqueeGallery].map((g, idx) => (
                  <div key={`marquee-${g.id || g.url || idx}-${idx}`} className="shrink-0 mr-4 last:mr-0 w-[220px] h-[220px]">
                    <PhotoCard
                      src={g.url || ''}
                      alt={g.prompt || ''}
                      prompt={g.prompt}
                      mode="fixed"
                      width={220}
                      height={220}
                      containerClassName="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-200 dark:bg-gray-800"
                      imgClassName="w-full h-full object-contain"
                      linkHref={g.id ? `https://app.myaiphotoshoot.com/#generate/${g.id}` : (g.url || undefined)}
                      linkExternal={Boolean(g.id || g.url)}
                    />
                  </div>
                ))}
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            .usecase-marquee-container { display: flex; overflow: hidden; width: 100%; position: relative; }
            .usecase-marquee-track-single { display: flex; align-items: center; animation: usecase-marquee-scroll 40s linear infinite; will-change: transform; }
            @keyframes usecase-marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          `}</style>
        </section>
      )}

      {/* How it works - static steps under header */}
      <section className={sectionSpacing} aria-label={tUseCase('howItWorks.title')}>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{tUseCase('howItWorks.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shrink-0">1</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tUseCase('howItWorks.step1.title')} <span className="text-gray-500">{tUseCase('howItWorks.step1.time')}</span></h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{tUseCase('howItWorks.step1.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shrink-0">2</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tUseCase('howItWorks.step2.title')} <span className="text-gray-500">{tUseCase('howItWorks.step2.time')}</span></h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{tUseCase('howItWorks.step2.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shrink-0">3</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tUseCase('howItWorks.step3.title')} <span className="text-gray-500">{tUseCase('howItWorks.step3.time')}</span></h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{tUseCase('howItWorks.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inject a featured image before each section, cycling through featured array beyond the first */}

      {/* Sections (structured with tailored styles) */}
      {sections.length > 0 && (
        <section className={`${sectionSpacing} grid grid-cols-1 gap-8`}>
          <div className="space-y-20 md:space-y-24">
            {sections.map((s, idx) => {
              const perSectionImage = perSectionPool.length ? perSectionPool[idx % perSectionPool.length] : undefined;
              const targetH = rowHeights[idx];
              const imageEl = perSectionImage ? (
                <div
                  className="order-1 md:order-none md:self-start w-full max-w-full relative aspect-square mx-auto"
                  style={typeof targetH === 'number' ? { width: `${targetH}px`, maxWidth: '100%' } : undefined}
                >
                  <Image
                    src={withDefaultCdnWidth(perSectionImage) || perSectionImage}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw"
                    className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm object-cover"
                  />
                </div>
              ) : null;
              const textEl = (
                <div ref={(el) => { textRefs.current[idx] = el; }} className="md:flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">{s.heading}</h2>
                  {s.heading === 'Intro' ? (
                    <div className="space-y-3 text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {s.body.map((p, i) => (<p key={i}>{p}</p>))}
                    </div>
                  ) : s.heading === 'Who This Is For' ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {s.body.map((p, i) => (
                        <li key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-gray-800 dark:text-gray-200 flex items-start gap-3">
                          <span className="mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-2.34a.75.75 0 10-1.06-1.06l-4.5 4.5-1.44-1.44a.75.75 0 10-1.06 1.06l1.97 1.97a.75.75 0 001.06 0l5.03-5.03z" clipRule="evenodd"/></svg>
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : s.heading === 'How It Works' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {s.body.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shrink-0">{i + 1}</div>
                          <p className="text-gray-800 dark:text-gray-200">{p.replace(/^\d+\)\s*/, '')}</p>
                        </div>
                      ))}
                    </div>
                  ) : s.heading === 'Outcomes' ? (
                    <ul className="space-y-2">
                      {s.body.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-800 dark:text-gray-200"><span className="text-green-600 dark:text-green-400" aria-hidden>✓</span><span>{p}</span></li>
                      ))}
                    </ul>
                  ) : s.heading === 'Examples' ? (
                    <ul className="list-disc pl-5 text-gray-800 dark:text-gray-200 space-y-1">
                      {s.body.map((p, i) => (<li key={i}>{p}</li>))}
                    </ul>
                  ) : s.heading === 'Objections Handled' ? (
                    <div className="space-y-2 text-gray-800 dark:text-gray-200">
                      {s.body.map((p, i) => (<p key={i}>• {p}</p>))}
                    </div>
                  ) : s.heading === 'CTA' ? (
                    <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-900/20 p-6 flex items-center justify-between gap-4">
                      <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">{s.body[0]}</p>
                  <a href="https://app.myaiphotoshoot.com" target="_blank" rel="noopener noreferrer" className="transform hover:scale-105 transition duration-150" aria-label={tDownload('webApp.button')}>
                    <span className="inline-flex items-center justify-center h-[56px] px-6 rounded-[10px] bg-black text-white border border-white/70">{tDownload('webApp.button')}</span>
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3 text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {s.body.map((p, i) => (<p key={i}>{p}</p>))}
                    </div>
                  )}
                </div>
              );

              const gridClass = idx % 2 === 0
                ? 'grid grid-cols-1 items-start justify-items-center md:justify-items-stretch gap-6 md:gap-6 md:grid-cols-[auto_minmax(0,1fr)_80px] lg:grid-cols-[auto_minmax(0,1fr)_96px]'
                : 'grid grid-cols-1 items-start justify-items-center md:justify-items-stretch gap-6 md:gap-6 md:grid-cols-[80px_minmax(0,1fr)_auto] lg:grid-cols-[96px_minmax(0,1fr)_auto]';

              return (
                <div key={idx} id={`sec-${idx}`}>
                  <div className={gridClass}>
                    {idx % 2 === 0 ? (
                      <>
                        {imageEl}
                        {textEl}
                        <div className="hidden md:block" aria-hidden />
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block" aria-hidden />
                        {textEl}
                        {imageEl}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      

      

      

      {/* FAQ accordion (simple) */}
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">{tFAQ('title')}</h2>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
            {faqs.map((f, i) => (
              <details key={i} className="p-5 group">
                <summary className="cursor-pointer list-none font-medium text-gray-900 dark:text-white flex items-center justify-between">
                  <span className="pr-4">{f.q}</span>
                  <span className="transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" aria-hidden>⌄</span>
                </summary>
                <div className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed inset-x-0 px-4 z-40" style={{ bottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
        <a
          href="https://app.myaiphotoshoot.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open My AI Photo Shoot app"
          className="block"
        >
          <div className="rounded-full shadow-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center py-3.5 px-7 font-semibold text-base tracking-tight ring-1 ring-purple-500/40">
              <span className="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path fillRule="evenodd" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0zm8.03-3.28a.75.75 0 10-1.06 1.06L12.94 12l-1.47 1.47a.75.75 0 101.06 1.06L14.06 13.06a1.5 1.5 0 000-2.12L12.53 8.72z" clipRule="evenodd" />
              </svg>
                <span>{tUseCase('stickyCta.label', { oneTimeFee: tPricing('oneTimeFeeAmount'), price: tPricing('price'), perPhoto: tPricing('perPhoto') })}</span>
            </span>
          </div>
        </a>
      </div>
    </article>
  );
}


