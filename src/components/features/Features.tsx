'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from '@/lib/utils';
import {
  ShieldCheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

export default function Features() {
  const t = useTranslations('features');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      name: t('advancedAI.title'),
      description: t('advancedAI.description'),
      icon: SparklesIcon,
    },
    {
      name: t('privacyFirst.title'),
      description: t('privacyFirst.description'),
      icon: ShieldCheckIcon,
    },
    {
      name: t('affordablePricing.title'),
      description: t('affordablePricing.description'),
      icon: CurrencyDollarIcon,
    },
    {
      name: t('thousandsOfStyles.title'),
      description: t('thousandsOfStyles.description'),
      icon: PhotoIcon,
    },
    {
      name: t('easyCustomization.title'),
      description: t('easyCustomization.description'),
      icon: AdjustmentsHorizontalIcon,
    },
    {
      name: t('multiplatform.title'),
      description: t('multiplatform.description'),
      icon: DevicePhoneMobileIcon,
    },
  ];

  return (
    <section id="features" className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div
          ref={ref}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:border-purple-100 dark:hover:border-purple-800 transition-colors duration-300"
            >
              <div className="absolute top-6 left-6">
                <feature.icon
                  className="h-8 w-8 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-16">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  {feature.name}
                </h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 