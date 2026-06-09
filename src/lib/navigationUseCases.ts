import { env } from '@/lib/env';

export type NavigationUseCase = {
  slug: string;
  title: string;
};

export async function fetchNavigationUseCases(locale: string): Promise<NavigationUseCase[]> {
  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=12&locale=${locale}`,
      { cache: 'force-cache' },
    );
    if (!response.ok) return [];

    const data = await response.json() as {
      items?: Array<{ slug?: unknown; title?: unknown }>;
    };

    return (Array.isArray(data.items) ? data.items : [])
      .filter(
        (item): item is { slug: string; title: string } =>
          typeof item.slug === 'string' && typeof item.title === 'string',
      )
      .map(({ slug, title }) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: 'base' }));
  } catch {
    return [];
  }
}
