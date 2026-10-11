type UseCaseIndexItem = {
  slug: string;
  title: string;
  featured_image_urls?: string[];
};

type UseCaseApiItem = {
  slug?: unknown;
  title?: unknown;
  featured_image_urls?: unknown;
};

export async function fetchUseCasesIndexItems(
  functionsUrl: string,
  locale: string,
): Promise<UseCaseIndexItem[]> {
  try {
    const response = await fetch(
      `${functionsUrl}/use-cases?page=1&limit=100&locale=${locale}&platform=web`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) {
      throw new Error(`Use cases index request failed (status ${response.status}).`);
    }

    const data = await response.json() as { items?: unknown } | null;
    if (!Array.isArray(data?.items)) {
      throw new Error('Use cases index response is missing an items array.');
    }

    return data.items.flatMap((raw, index) => {
      const item = raw as UseCaseApiItem | null;
      if (
        typeof item?.title !== 'string'
        || (item.slug !== null && typeof item.slug !== 'string')
      ) {
        throw new Error(`Use cases index response contains an invalid item at position ${index + 1}.`);
      }
      if (item.slug === null) return [];

      return [{
        slug: item.slug,
        title: item.title,
        featured_image_urls: Array.isArray(item.featured_image_urls)
          ? (item.featured_image_urls as string[])
          : undefined,
      }];
    });
  } catch (error) {
    throw new Error(`Failed to load the use cases index for locale "${locale}".`, {
      cause: error,
    });
  }
}
