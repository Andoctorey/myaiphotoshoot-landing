import type {
  AiMaskCategoryLanding,
  AiMaskCategoryLandingFaq,
} from '@/types/ai-mask';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonBlankString(value: unknown, field: string, rowIndex: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Mask category landing row ${rowIndex} has an invalid ${field}.`);
  }
  return value.trim();
}

function nonBlankStringArray(value: unknown, field: string, rowIndex: number): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Mask category landing row ${rowIndex} has an invalid ${field} array.`);
  }
  return value.map((item, itemIndex) => (
    nonBlankString(item, `${field}[${itemIndex}]`, rowIndex)
  ));
}

function faqArray(value: unknown, rowIndex: number): AiMaskCategoryLandingFaq[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Mask category landing row ${rowIndex} has an invalid faqs array.`);
  }

  return value.map((item, faqIndex) => {
    if (!isRecord(item)) {
      throw new Error(`Mask category landing row ${rowIndex} has an invalid faq at index ${faqIndex}.`);
    }
    const keys = Object.keys(item).sort();
    if (keys.length !== 2 || keys[0] !== 'a' || keys[1] !== 'q') {
      throw new Error(`Mask category landing row ${rowIndex} has an invalid faq shape at index ${faqIndex}.`);
    }
    return {
      q: nonBlankString(item.q, `faqs[${faqIndex}].q`, rowIndex),
      a: nonBlankString(item.a, `faqs[${faqIndex}].a`, rowIndex),
    };
  });
}

export function normalizePublishedMaskCategoryLandings(
  value: unknown,
  supportedLocales: readonly string[],
): AiMaskCategoryLanding[] {
  if (!Array.isArray(value)) {
    throw new Error('Published mask category landing RPC response was not an array.');
  }

  const supportedLocaleSet = new Set(supportedLocales);
  const landings = value.map((item, rowIndex): AiMaskCategoryLanding => {
    if (!isRecord(item)) {
      throw new Error(`Mask category landing row ${rowIndex} was not an object.`);
    }

    const locale = nonBlankString(item.locale, 'locale', rowIndex);
    if (!supportedLocaleSet.has(locale)) {
      throw new Error(`Mask category landing row ${rowIndex} has unsupported locale "${locale}".`);
    }
    const slug = nonBlankString(item.slug, 'slug', rowIndex);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Mask category landing row ${rowIndex} has an invalid slug.`);
    }
    const updatedAt = nonBlankString(item.updated_at, 'updated_at', rowIndex);
    if (!Number.isFinite(Date.parse(updatedAt))) {
      throw new Error(`Mask category landing row ${rowIndex} has an invalid updated_at timestamp.`);
    }

    return {
      categoryId: nonBlankString(item.category_id, 'category_id', rowIndex),
      slug,
      locale,
      title: nonBlankString(item.title, 'title', rowIndex),
      description: nonBlankString(item.description, 'description', rowIndex),
      introduction: nonBlankString(item.introduction, 'introduction', rowIndex),
      photoGuidance: nonBlankStringArray(item.photo_guidance, 'photo_guidance', rowIndex),
      expectations: nonBlankStringArray(item.expectations, 'expectations', rowIndex),
      limitations: nonBlankStringArray(item.limitations, 'limitations', rowIndex),
      faqs: faqArray(item.faqs, rowIndex),
      updatedAt,
    };
  });

  const routeKeys = new Set<string>();
  const categoryLocales = new Set<string>();
  const categorySlugs = new Map<string, string>();
  const slugCategories = new Map<string, string>();
  for (const landing of landings) {
    const routeKey = `${landing.locale}:${landing.slug}`;
    const categoryLocale = `${landing.categoryId}:${landing.locale}`;
    if (routeKeys.has(routeKey) || categoryLocales.has(categoryLocale)) {
      throw new Error('Published mask category landing RPC response contained duplicate routes.');
    }
    routeKeys.add(routeKey);
    categoryLocales.add(categoryLocale);

    const knownSlug = categorySlugs.get(landing.categoryId);
    const knownCategory = slugCategories.get(landing.slug);
    if ((knownSlug && knownSlug !== landing.slug) || (knownCategory && knownCategory !== landing.categoryId)) {
      throw new Error('Published mask category landing RPC response contained inconsistent category slugs.');
    }
    categorySlugs.set(landing.categoryId, landing.slug);
    slugCategories.set(landing.slug, landing.categoryId);
  }

  const localeOrder = new Map(supportedLocales.map((locale, index) => [locale, index]));
  return landings.sort((left, right) => (
    left.slug.localeCompare(right.slug)
    || (localeOrder.get(left.locale) ?? Number.MAX_SAFE_INTEGER)
      - (localeOrder.get(right.locale) ?? Number.MAX_SAFE_INTEGER)
  ));
}
