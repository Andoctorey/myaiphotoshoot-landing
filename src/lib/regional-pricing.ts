import type {
  BillingCadence,
  PricingCatalog,
  PricingOffer,
  PricingOfferId,
  PricingTier,
  PricingTierId,
  TrainingEntitlement,
} from '@/lib/pricing';

type ParsedOffer = {
  currency: string;
  offer: PricingOffer;
};
type OfferParseResult = ParsedOffer | null | undefined;

const cadenceOrder: Record<BillingCadence, number> = {
  annual: 0,
  monthly: 1,
  weekly: 2,
  oneTime: 3,
};

export function pricingCatalogFromApi(value: unknown): PricingCatalog | null {
  const root = asRecord(value);
  if (!root) return null;

  const countryCode = normalizedCode(root.country_code, 2);
  const countryGroup = root.country_group;
  if (
    !countryCode
    || (countryGroup !== 'A' && countryGroup !== 'B' && countryGroup !== 'C')
    || typeof root.adaptive_pricing !== 'boolean'
    || !Array.isArray(root.packages)
    || !Array.isArray(root.plans)
  ) {
    return null;
  }

  const packages = parseKnownOffers(root.packages, parsePackageOffer);
  const plans = parseKnownOffers(root.plans, parsePlanOffer);
  if (!packages || !plans) return null;
  const currencies = new Set(
    [...packages, ...plans].map((parsedOffer) => parsedOffer.currency),
  );
  if (packages.length === 0 || plans.length === 0 || currencies.size !== 1) return null;

  const currency = [...currencies][0];
  const paygOffers = packages.map(({ offer }) => offer);
  const proOffers = pricingPlanOffers(plans, 'pro');
  const maxOffers = pricingPlanOffers(plans, 'max');
  if (proOffers.length === 0 || maxOffers.length === 0) return null;

  return {
    currency,
    referenceMarket: countryCode,
    countryGroup,
    adaptivePricing: root.adaptive_pricing,
    creditsNeverExpire: true,
    trialAvailable: false,
    tiers: [
      {
        id: 'payg',
        defaultOfferId: paygOffers[0].id,
        maxResolution: '1K',
        training: null,
        offers: paygOffers,
      },
      pricingTier('pro', proOffers, '2K', 'standard'),
      pricingTier('max', maxOffers, '4K', 'full'),
    ],
  };
}

function parseKnownOffers(
  values: readonly unknown[],
  parse: (row: Record<string, unknown>) => OfferParseResult,
): ParsedOffer[] | null {
  const offers: ParsedOffer[] = [];
  for (const value of values) {
    const row = asRecord(value);
    if (!row) return null;
    const offer = parse(row);
    if (offer === null) return null;
    if (!offer) continue;
    offers.push(offer);
  }
  return offers;
}

function parsePackageOffer(row: Record<string, unknown>): OfferParseResult {
  const id = paygOfferId(row.product_id);
  if (!id) return undefined;
  const price = positiveNumber(row.value);
  const credits = positiveInteger(row.included_credits);
  const currency = normalizedCode(row.currency, 3);
  if (price === null || credits === null || !currency) return null;

  return {
    currency,
    offer: {
      id,
      cadence: 'oneTime',
      price,
      credits,
      creditGrantPeriod: 'oneTime',
    },
  };
}

function parsePlanOffer(row: Record<string, unknown>): OfferParseResult {
  const identity = planOfferIdentity(row.product_id, row.base_plan_id);
  if (!identity) return undefined;
  const price = positiveNumber(row.value);
  const credits = positiveInteger(row.included_credits);
  const currency = normalizedCode(row.currency, 3);
  if (price === null || credits === null || !currency) return null;

  return {
    currency,
    offer: {
      id: identity.id,
      cadence: identity.cadence,
      price,
      credits,
      creditGrantPeriod: identity.cadence === 'weekly' ? 'weekly' : 'monthly',
    },
  };
}

function pricingPlanOffers(
  plans: readonly ParsedOffer[],
  tierId: Exclude<PricingTierId, 'payg'>,
): PricingOffer[] {
  const offers = plans
    .map(({ offer }) => offer)
    .filter((offer) => offer.id.startsWith(`${tierId}-`))
    .sort((left, right) => cadenceOrder[left.cadence] - cadenceOrder[right.cadence]);
  const annual = offers.find((offer) => offer.cadence === 'annual');
  const monthly = offers.find((offer) => offer.cadence === 'monthly');
  if (!annual || !monthly) return offers;

  const annualSavingsPercent = Math.round((1 - annual.price / (monthly.price * 12)) * 100);
  return offers.map((offer) => (
    offer.id === annual.id ? { ...offer, annualSavingsPercent } : offer
  ));
}

function pricingTier(
  id: Exclude<PricingTierId, 'payg'>,
  offers: PricingOffer[],
  maxResolution: PricingTier['maxResolution'],
  training: Exclude<TrainingEntitlement, null>,
): PricingTier {
  const defaultOffer = offers.find((offer) => offer.cadence === 'annual')
    || offers.find((offer) => offer.cadence === 'monthly')
    || offers[0];
  return {
    id,
    defaultOfferId: defaultOffer.id,
    maxResolution,
    training,
    offers,
  };
}

function paygOfferId(productId: unknown): PricingOfferId | null {
  if (productId === 'package_30') return 'payg-30';
  if (productId === 'package_100') return 'payg-100';
  if (productId === 'package_200') return 'payg-200';
  if (productId === 'package_300') return 'payg-300';
  return null;
}

function planOfferIdentity(
  productId: unknown,
  basePlanId: unknown,
): { id: PricingOfferId; cadence: Exclude<BillingCadence, 'oneTime'> } | null {
  if (productId === 'pro' && basePlanId === 'weekly') {
    return { id: 'pro-weekly', cadence: 'weekly' };
  }
  if (productId === 'pro' && basePlanId === 'monthly') {
    return { id: 'pro-monthly', cadence: 'monthly' };
  }
  if (productId === 'pro' && basePlanId === 'annual') {
    return { id: 'pro-annual', cadence: 'annual' };
  }
  if (productId === 'max' && basePlanId === 'monthly') {
    return { id: 'max-monthly', cadence: 'monthly' };
  }
  if (productId === 'max' && basePlanId === 'annual') {
    return { id: 'max-annual', cadence: 'annual' };
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

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function normalizedCode(value: unknown, length: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return new RegExp(`^[A-Z]{${length}}$`).test(normalized) ? normalized : null;
}
