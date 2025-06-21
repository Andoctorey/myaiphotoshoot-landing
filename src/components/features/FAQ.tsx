'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useTranslations } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const t = useTranslations('faq');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqItems: FAQItem[] = [
    {
      question: t('whyNotChatGPT.question'),
      answer: t('whyNotChatGPT.answer'),
    },
    {
      question: t('howItWorks.question'),
      answer: t('howItWorks.answer'),
    },
    {
      question: t('pricing.question'),
      answer: t('pricing.answer'),
    },
    {
      question: t('privacy.question'),
      answer: t('privacy.answer'),
    },
    {
      question: t('imageQuality.question'),
      answer: t('imageQuality.answer'),
    },
    {
      question: t('howManyPhotos.question'),
      answer: t('howManyPhotos.answer'),
    },
    {
      question: t('platforms.question'),
      answer: t('platforms.answer'),
    },
    {
      question: t('dataRetention.question'),
      answer: t('dataRetention.answer'),
    },
  ];

  return (
    <section id="faq" className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('description')}
            </p>
          </motion.div>
        </div>

        <div ref={ref} className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-expanded={openItems.includes(index)}
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
                  {item.question}
                </h3>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 flex-shrink-0 ${
                    openItems.includes(index) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openItems.includes(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-4"
                >
                  <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
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