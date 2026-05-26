import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import { localePath } from '@/lib/seo';

type UseCaseIndexItem = {
  slug: string;
  title: string;
  featured_image_urls?: string[];
};

type UseCaseApiItem = {
  slug?: string;
  title?: string;
  featured_image_urls?: unknown;
};

async function fetchUseCases(locale: string): Promise<UseCaseIndexItem[]> {
  try {
    const res = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=100&locale=${locale}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const rawItems: UseCaseApiItem[] = Array.isArray(data.items) ? data.items as UseCaseApiItem[] : [];
    return rawItems
      .filter((it) => typeof it?.slug === 'string' && typeof it?.title === 'string')
      .map((it) => ({
        slug: it.slug as string,
        title: it.title as string,
        featured_image_urls: Array.isArray(it.featured_image_urls) ? (it.featured_image_urls as string[]) : undefined,
      }));
  } catch {
    return [];
  }
}

type Props = {
  locale: string;
  title: string;
  emptyLabel: string;
};

export default async function UseCasesIndex({ locale, title, emptyLabel }: Props) {
  const items = await fetchUseCases(locale);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">{title}</h1>
      {items.length === 0 ? (
        <div className="text-gray-600">{emptyLabel}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link key={it.slug} href={localePath(locale, `/use-cases/${it.slug}/`)} className="block group">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {Array.isArray(it.featured_image_urls) && it.featured_image_urls[0] && (
                  <Image src={it.featured_image_urls[0]} alt="" width={640} height={360} className="w-full h-auto" />
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">{it.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
