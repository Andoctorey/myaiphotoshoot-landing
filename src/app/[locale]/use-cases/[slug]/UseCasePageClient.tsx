'use client';

import Image from 'next/image';
import FAQSchema from '@/components/blog/FAQSchema';
import { useUseCase } from '@/hooks/useUseCase';
import type { UseCase } from '@/types/usecase';

interface Props {
  slug: string;
  locale: string;
  initialUseCase?: UseCase;
}

export default function UseCasePageClient({ slug, locale, initialUseCase }: Props) {
  const { useCase, isLoading } = useUseCase({ slug, locale, fallbackData: initialUseCase });

  if (isLoading && !useCase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">Use case not found.</div>
    );
  }

  const t = useCase.translations?.[locale] || useCase.translations?.['en'];
  const title = t?.title || (useCase as any).title || useCase.slug || 'Use case';
  const sections = useCase.sections || t?.sections || [];
  const gallery = useCase.gallery_photos || [];
  const benefits = useCase.benefits || t?.benefits || [];
  const faqs = useCase.faqs || t?.faqs || [];
  const description = t?.meta_description || (useCase as any).meta_description || '';

  return (
    <article className="max-w-5xl mx-auto px-4 py-14">
      {/* SEO Schema for FAQ */}
      {faqs.length > 0 && (
        <FAQSchema faqs={faqs.map(f => ({ question: f.q, answer: f.a }))} />
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <ol className="flex items-center gap-1 flex-wrap">
          <li><a href={`/${locale}/`} className="hover:text-gray-700 dark:hover:text-gray-200">Home</a></li>
          <li>/</li>
          <li><a href={`/${locale}/use-cases/`} className="hover:text-gray-700 dark:hover:text-gray-200">Use Cases</a></li>
          <li>/</li>
          <li aria-current="page" className="text-gray-700 dark:text-gray-200">{title}</li>
        </ol>
      </nav>
      <header className="mb-10">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="https://app.myaiphotoshoot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-900 transition duration-150 shadow-md dark:shadow-purple-900/20 border-transparent dark:border-white/10"
                aria-label="Launch Now"
              >
                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Launch Now
              </a>
              <div className="flex items-center gap-2">
                <a
                  href={'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=usecase&medium=cta&campaign=' + encodeURIComponent(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition duration-150"
                  aria-label="Get it on Google Play"
                >
                  <picture>
                    <source srcSet="/images/google-play-badge.webp" type="image/webp" />
                    <img alt="Google Play" src='/images/google-play-badge.png' width={180} height={100} className="h-[100px] w-[180px] object-contain" />
                  </picture>
                </a>
                <a
                  href="https://apps.apple.com/app/id6744860178"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition duration-150"
                  aria-label="Download on the App Store"
                >
                  <img alt="App Store" src='/images/app-store-badge.svg' width={180} height={50} className="h-[50px] w-[180px] object-contain" />
                </a>
              </div>
            </div>
          </div>
          {useCase.featured_image_url && (
            <div className="hidden sm:block shrink-0">
              <Image
                src={useCase.featured_image_url}
                alt=""
                width={240}
                height={135}
                className="w-48 md:w-60 h-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {/* Sections (structured) */}
      {sections.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-8">
          {/* Mini TOC */}
          <aside className="hidden md:block">
            <div className="sticky top-28">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">On this page</div>
              <ul className="space-y-2 text-sm">
                {sections.map((s, idx) => (
                  <li key={idx}>
                    <a href={`#sec-${idx}`} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">{s.heading}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          {/* Content */}
          <div className="space-y-8">
            {sections.map((s, idx) => (
              <div key={idx} id={`sec-${idx}`}>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{s.heading}</h2>
                <div className="space-y-3 text-gray-800 dark:text-gray-200 leading-relaxed">
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mid-page CTA */}
      <div className="mt-10">
        <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-900/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ready to create this use case?</h3>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Generate your first photos in minutes. No studio, no hassle.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://app.myaiphotoshoot.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-900 transition duration-150 shadow-md dark:shadow-purple-900/20 border-transparent dark:border-white/10">
              <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Launch Now
            </a>
            <div className="flex items-center gap-2">
              <a href={'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=usecase&medium=cta&campaign=' + encodeURIComponent(slug)} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className="transform hover:scale-105 transition duration-150">
                <picture>
                  <source srcSet="/images/google-play-badge.webp" type="image/webp" />
                  <img alt="Google Play" src='/images/google-play-badge.png' width={180} height={100} className="h-[100px] w-[180px] object-contain" />
                </picture>
              </a>
              <a href="https://apps.apple.com/app/id6744860178" target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" className="transform hover:scale-105 transition duration-150">
                <img alt="App Store" src='/images/app-store-badge.svg' width={180} height={50} className="h-[50px] w-[180px] object-contain" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery (simple horizontal scroll prototype) */}
      {gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {gallery.map((g, idx) => (
                <div key={idx} className="shrink-0">
                  <div className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <Image
                      src={g.url || ''}
                      alt={g.prompt || ''}
                      width={384}
                      height={216}
                      className="w-96 h-auto object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits grid */}
      {benefits.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Benefits</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <li key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-gray-800 dark:text-gray-200 flex items-start gap-3">
                <span className="mt-0.5 text-green-600 dark:text-green-400" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-2.34a.75.75 0 10-1.06-1.06l-4.5 4.5-1.44-1.44a.75.75 0 10-1.06 1.06l1.97 1.97a.75.75 0 001.06 0l5.03-5.03z" clipRule="evenodd"/></svg>
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ accordion (simple) */}
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
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
      <div className="sm:hidden fixed bottom-4 inset-x-0 px-4 z-40">
        <div className="rounded-full shadow-lg border border-purple-200 dark:border-purple-900/40 bg-white dark:bg-gray-900 overflow-hidden flex">
          <a href={`/${locale}#download`} className="flex-1 text-center py-3 font-semibold text-white bg-purple-600 hover:bg-purple-700">Try now</a>
          <a href={`/${locale}#pricing`} className="w-32 text-center py-3 font-semibold text-gray-800 dark:text-gray-100">Pricing</a>
        </div>
      </div>
    </article>
  );
}


