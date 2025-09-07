'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Props {
  initialUseCases?: Array<{ slug: string; title: string; featured_image_urls?: string[] }>;
  locale?: string;
}

export default function HomeUseCases({ initialUseCases = [], locale = 'en' }: Props) {
  return (
    <section id="use-cases" className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
            <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v9.19l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 011.06-1.06l3.22 3.22V5.25A.75.75 0 0112 4.5z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900">Use Cases</h2>
        </div>

        {initialUseCases.length === 0 ? (
          <div className="text-gray-600">Coming soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialUseCases.map((it) => (
              <Link key={it.slug} href={`/${locale}/use-cases/${it.slug}/`} className="block group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {Array.isArray(it.featured_image_urls) && it.featured_image_urls[0] && (
                    <Image src={it.featured_image_urls[0]} alt="" width={640} height={360} className="w-full h-auto" />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:underline">{it.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


