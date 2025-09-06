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
  const content = t?.content || (useCase as any).content || '';
  const gallery = useCase.gallery_photos || [];
  const benefits = useCase.benefits || t?.benefits || [];
  const faqs = useCase.faqs || t?.faqs || [];

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        {useCase.featured_image_url && (
          <div className="mt-6">
            <Image
              src={useCase.featured_image_url}
              alt=""
              width={1200}
              height={630}
              className="w-full h-auto rounded-xl border border-gray-200"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {content ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Content coming soon.</p>
        )}
      </div>

      {/* Gallery (simple horizontal scroll prototype) */}
      {gallery.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-3">Gallery</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {gallery.map((g, idx) => (
              <div key={idx} className="shrink-0">
                <Image
                  src={g.url || ''}
                  alt={g.prompt || ''}
                  width={384}
                  height={216}
                  className="w-96 h-auto rounded-lg border border-gray-200"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Benefits grid */}
      {benefits.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Benefits</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <li key={i} className="bg-white rounded-lg border border-gray-200 p-4 text-gray-800">{b}</li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ accordion (simple) */}
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
            {faqs.map((f, i) => (
              <details key={i} className="p-4 group">
                <summary className="cursor-pointer list-none font-medium text-gray-900 flex items-center justify-between">
                  <span>{f.q}</span>
                  <span className="transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="mt-2 text-gray-700">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}


