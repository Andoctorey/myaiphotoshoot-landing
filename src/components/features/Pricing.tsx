'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '@/lib/utils';

export default function Pricing() {
  const t = useTranslations('pricing');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    t('features.training'),
    t('features.unlimited'),
    t('features.custom'),
    t('features.privacy'),
    t('features.social'),
    t('features.download'),
    t('features.support'),
    t('features.updates'),
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mt-20 max-w-lg mx-auto rounded-2xl shadow-xl dark:shadow-purple-900/20 overflow-hidden lg:max-w-none lg:flex"
        >
          <div className="flex-1 bg-white dark:bg-gray-800 px-6 py-8 lg:p-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('payAsYouGo')}</h3>
            <p className="mt-6 text-base text-gray-500 dark:text-gray-300">
              {t('perfectFor')}
            </p>
            <div className="mt-8">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 pr-4 text-base font-semibold text-purple-600 dark:text-purple-400">
                  {t('whatsIncluded')}
                </h4>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              <ul className="mt-8 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start lg:col-span-1">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="py-8 px-6 text-center bg-gray-50 dark:bg-gray-700 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12">
            <div className="mt-4 flex items-center justify-center text-5xl font-extrabold text-gray-900 dark:text-white">
              <span>{t('price')}</span>
              <span className="ml-3 text-xl font-medium text-gray-500 dark:text-gray-300">{t('perPhoto')}</span>
            </div>
            <div className="mt-6">
              <div className="rounded-md shadow">
                <a
                  href="#download-options"
                  className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  {t('getStarted')}
                </a>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{t('oneTimeFee')}</p>
              <p className="text-gray-500 dark:text-gray-400">{t('oneTimeFeeAmount')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 