import Link from 'next/link';
import Image from 'next/image';
import { env } from '@/lib/env';

interface PageProps { params: Promise<{ locale: string }> }

export default async function UseCasesIndex({ params }: PageProps) {
  const { locale } = await params;
  let items: Array<{ slug: string; title: string; featured_image_urls?: string[] }> = [];
  try {
    const res = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=100&locale=${locale}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      items = (data.items || []).map((it: any) => ({ slug: it.slug, title: it.title, featured_image_urls: it.featured_image_urls }));
    }
  } catch {}

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Use Cases</h1>
      {items.length === 0 ? (
        <div className="text-gray-600">No use cases yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link key={it.slug} href={`/${locale}/use-cases/${it.slug}/`} className="block group">
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


