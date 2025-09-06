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
  const title = t?.title || useCase.slug || 'Use case';
  const content = t?.content || '';
  const gallery = useCase.gallery_photos || [];

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
    </article>
  );
}


