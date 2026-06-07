'use client';

import { useId, useState } from 'react';
import { useTranslations } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const t = useTranslations('faq');
  const faqId = useId();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqItems: FAQItem[] = [
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
    <section
      id="faq"
      className="py-12 bg-gray-50 dark:bg-gray-800"
      aria-labelledby={`${faqId}-title`}
      aria-describedby={`${faqId}-description`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div>
            <h2
              id={`${faqId}-title`}
              className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl"
            >
              {t('title')}
            </h2>
            <p
              id={`${faqId}-description`}
              className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              {t('description')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openItems.includes(index);
            const triggerId = `${faqId}-trigger-${index}`;
            const panelId = `${faqId}-panel-${index}`;

            return (
              <div
                key={item.question}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <h3>
                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="text-lg font-medium text-gray-900 dark:text-white ltr:pr-4 rtl:pl-4">
                      {item.question}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Schema.org structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqItems.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer
                }
              }))
            })
          }}
        />
      </div>
    </section>
  );
} 
