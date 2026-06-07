type DigitalOfferPoliciesOptions = {
  priceCurrency: string;
  policyUrl: string;
};

export function buildDigitalOfferPolicies({
  priceCurrency,
  policyUrl,
}: DigitalOfferPoliciesOptions) {
  const immediateDeliveryTime = {
    '@type': 'QuantitativeValue',
    minValue: 0,
    maxValue: 0,
    unitCode: 'DAY',
  } as const;

  return {
    availability: 'https://schema.org/OnlineOnly',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: policyUrl,
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'US',
      },
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: 0,
        currency: priceCurrency,
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: immediateDeliveryTime,
        transitTime: immediateDeliveryTime,
      },
    },
  } as const;
}
