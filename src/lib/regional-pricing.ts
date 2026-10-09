import type { PricingCatalog, PricingOffer, PricingOfferId } from '@/lib/pricing';

type ParsedOffer = { currency: string; offer: PricingOffer };

export function pricingCatalogFromApi(value: unknown): PricingCatalog | null {
  const root = asRecord(value);
  if (!root || root.catalog_version !== 'v2') return null;

  const countryCode = normalizedCode(root.country_code, 2);
  if (
    !countryCode
    || typeof root.adaptive_pricing !== 'boolean'
    || !Array.isArray(root.packages)
    || !Array.isArray(root.plans)
  ) {
    return null;
  }

  const packages = parseOffers(root.packages, 'package');
  const subscriptions = parseOffers(root.plans, 'subscription');
  if (!packages?.length || !subscriptions?.length) return null;

  const currencies = new Set([...packages, ...subscriptions].map((item) => item.currency));
  if (currencies.size !== 1) return null;

  return {
    catalogVersion: 'v2',
    currency: [...currencies][0],
    referenceMarket: countryCode,
    adaptivePricing: root.adaptive_pricing,
    packages: packages.map((item) => item.offer).sort((a, b) => a.credits - b.credits),
    subscriptions: subscriptions
      .map((item) => item.offer)
      .sort((a, b) => Number(a.cadence !== 'annual') - Number(b.cadence !== 'annual')),
  };
}

function parseOffers(values: unknown[], kind: 'package' | 'subscription'): ParsedOffer[] | null {
  const offers: ParsedOffer[] = [];
  const seen = new Set<PricingOfferId>();

  for (const value of values) {
    const row = asRecord(value);
    if (!row) return null;

    const identity = offerIdentity(row, kind);
    // New products may be added to the public catalog before landing supports them.
    if (!identity) continue;

    const price = positiveNumber(row.value);
    const credits = positiveNumber(row.included_credits);
    const currency = normalizedCode(row.currency, 3);
    if (
      price === null
      || credits === null
      || !Number.isSafeInteger(credits)
      || !currency
      || seen.has(identity.id)
    ) {
      return null;
    }
    seen.add(identity.id);
    offers.push({ currency, offer: { ...identity, price, credits } });
  }

  return offers;
}

function offerIdentity(
  row: Record<string, unknown>,
  kind: 'package' | 'subscription',
): Pick<PricingOffer, 'id' | 'cadence' | 'creditGrantPeriod'> | null {
  if (kind === 'package') {
    const id = row.product_id;
    return id === 'v2_package_10' || id === 'v2_package_100' || id === 'v2_package_500'
      ? { id, cadence: 'oneTime', creditGrantPeriod: 'oneTime' }
      : null;
  }
  if (row.product_id !== 'v2') return null;
  if (row.base_plan_id === 'annual') {
    return { id: 'v2:annual', cadence: 'annual', creditGrantPeriod: 'weekly' };
  }
  if (row.base_plan_id === 'weekly') {
    return { id: 'v2:weekly', cadence: 'weekly', creditGrantPeriod: 'weekly' };
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function normalizedCode(value: unknown, length: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return new RegExp(`^[A-Z]{${length}}$`).test(normalized) ? normalized : null;
}
