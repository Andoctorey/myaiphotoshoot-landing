import { getTranslations } from 'next-intl/server';
import { serializeJsonLd } from '@/lib/json-ld';
import FAQAccordion, { type FAQItem } from './FAQAccordion';

export default async function FAQ({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'faq' });
  const items: FAQItem[] = [
    {
      question: t('howItWorks.question'),
      answer: t('howItWorks.answer'),
    },
    {
      question: t('sourcePhotos.question'),
      answer: t('sourcePhotos.answer'),
    },
    {
      question: t('pricing.question'),
      answer: t('pricing.answer'),
    },
    {
      question: t('imageQuality.question'),
      answer: t('imageQuality.answer'),
    },
    {
      question: t('privacy.question'),
      answer: t('privacy.answer'),
    },
    {
      question: t('platforms.question'),
      answer: t('platforms.answer'),
    },
    {
      question: t('whyNotChatGPT.question'),
      answer: t('whyNotChatGPT.answer'),
    },
  ];

  return (
    <section id="faq" className="bg-gray-50 py-12 dark:bg-gray-800 md:py-16">
      <FAQAccordion
        title={t('title')}
        description={t('description')}
        items={items}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
