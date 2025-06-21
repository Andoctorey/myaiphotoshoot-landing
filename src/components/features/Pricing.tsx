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
    <section id="pricing" className="py-32 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            {t('title')}
          </h2>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 sm:text-2xl max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mt-24 max-w-4xl mx-auto rounded-3xl shadow-2xl dark:shadow-purple-900/30 overflow-hidden lg:max-w-none lg:flex"
        >
          <div className="flex-1 bg-white dark:bg-gray-800 px-8 py-12 lg:p-16">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">{t('payAsYouGo')}</h3>
            <p className="mt-8 text-lg text-gray-500 dark:text-gray-300 lg:text-xl">
              {t('perfectFor')}
            </p>
            <div className="mt-12">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 ltr:pr-4 rtl:pl-4 text-lg font-semibold text-purple-600 dark:text-purple-400 lg:text-xl">
                  {t('whatsIncluded')}
                </h4>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              <ul className="mt-10 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start lg:col-span-1">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                    </div>
                    <p className="ltr:ml-4 rtl:mr-4 text-base text-gray-700 dark:text-gray-300 lg:text-lg">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="py-12 px-8 text-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 dark:bg-gray-700 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-16">
            <div className="mt-6 flex items-center justify-center text-6xl font-extrabold text-gray-900 dark:text-white lg:text-7xl">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t('price')}</span>
              <span className="ltr:ml-4 rtl:mr-4 text-2xl font-medium text-gray-500 dark:text-gray-300 lg:text-3xl">{t('perPhoto')}</span>
            </div>
            <div className="mt-8">
              <div className="rounded-xl shadow-lg">
                <a
                  href="#download-options"
                  className="flex items-center justify-center px-8 py-5 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 lg:text-xl"
                >
                  {t('getStarted')}
                </a>
              </div>
            </div>
            <div className="mt-8 p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <p className="text-lg font-bold text-gray-900 dark:text-white lg:text-xl">{t('oneTimeFee')}</p>
              <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400 lg:text-4xl">{t('oneTimeFeeAmount')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 