'use client';

import Image from 'next/image';
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
      <header className="mb-10">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{title}</h1>
            {description && (
              <p className="mt-3 text-lg text-gray-600 leading-relaxed">{description}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={`/${locale}#download`}
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-2.5 text-white font-semibold shadow-sm hover:bg-purple-700 transition-colors"
              >
                Try it now
              </a>
              <a
                href={`/${locale}#pricing`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-gray-800 font-semibold hover:bg-gray-50"
              >
                See pricing
              </a>
            </div>
          </div>
          {useCase.featured_image_url && (
            <div className="hidden sm:block shrink-0">
              <Image
                src={useCase.featured_image_url}
                alt=""
                width={240}
                height={135}
                className="w-48 md:w-60 h-auto rounded-xl border border-gray-200 shadow-sm object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {/* Sections (structured) */}
      {sections.length > 0 && (
        <section className="space-y-8">
          {sections.map((s, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{s.heading}</h2>
              <div className="space-y-3 text-gray-800 leading-relaxed">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Mid-page CTA */}
      <div className="mt-10">
        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to create this use case?</h3>
            <p className="text-gray-700 mt-1">Generate your first photos in minutes. No studio, no hassle.</p>
          </div>
          <div className="flex gap-3">
            <a href={`/${locale}#download`} className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-purple-700 transition-colors">Get started</a>
            <a href={`/${locale}#pricing`} className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 font-semibold hover:bg-white">Pricing</a>
          </div>
        </div>
      </div>

      {/* Gallery (simple horizontal scroll prototype) */}
      {gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {gallery.map((g, idx) => (
                <div key={idx} className="shrink-0">
                  <div className="group relative rounded-lg border border-gray-200 overflow-hidden shadow-sm">
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
              <li key={i} className="bg-white rounded-xl border border-gray-200 p-5 text-gray-800 flex items-start gap-3">
                <span className="mt-0.5 text-green-600" aria-hidden>
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
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white">
            {faqs.map((f, i) => (
              <details key={i} className="p-5 group">
                <summary className="cursor-pointer list-none font-medium text-gray-900 flex items-center justify-between">
                  <span className="pr-4">{f.q}</span>
                  <span className="transition-transform group-open:rotate-180 text-gray-500" aria-hidden>⌄</span>
                </summary>
                <div className="mt-2 text-gray-700 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed bottom-4 inset-x-0 px-4 z-40">
        <div className="rounded-full shadow-lg border border-purple-200 bg-white overflow-hidden flex">
          <a href={`/${locale}#download`} className="flex-1 text-center py-3 font-semibold text-white bg-purple-600 hover:bg-purple-700">Try now</a>
          <a href={`/${locale}#pricing`} className="w-32 text-center py-3 font-semibold text-gray-800">Pricing</a>
        </div>
      </div>
    </article>
  );
}


