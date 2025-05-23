'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/utils';

export default function Download() {
  const t = useTranslations('download');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const getAppUrl = () => {
    switch (deviceType) {
      case 'ios':
        return 'https://apps.apple.com/app/id6744860178';
      case 'android':
        return 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1';
      default:
        return 'https://app.myaiphotoshoot.com';
    }
  };

  return (
    <section id="download" className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* App Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-end relative"
          >
            <a
              href={getAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-[600px] w-[300px] rounded-[36px] overflow-hidden shadow-xl dark:shadow-purple-900/20 transform hover:scale-105 transition-transform duration-300"
            >
              {/* Background matching page gradient */}
              <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800"></div>
              <div className="relative z-10 w-full h-full">
                <picture>
                  <source srcSet="/images/screenshot_ios.webp" type="image/webp" />
                  <img
                    src="/images/screenshot_ios.png"
                    alt="MyAIPhotoShoot App"
                    className="object-contain w-full h-full"
                  />
                </picture>
              </div>
            </a>
          </motion.div>

          {/* Download Options */}
          <motion.div
            id="download-options"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center lg:items-start"
          >
            {/* Platform options */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-purple-900/20 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{t('choosePlatform')}</h3>
              
              {/* Web App */}
              <div className="mb-8 text-center">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('webApp.title')}</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t('webApp.description')}</p>
                <a
                  href="https://app.myaiphotoshoot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-900 transition duration-150 ease-in-out"
                >
                  <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {t('webApp.button')}
                </a>
              </div>
              
              {/* Mobile Apps */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('mobileApps.title')}</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t('mobileApps.description')}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start items-center">
                  {/* Google Play Button */}
                  <a 
                    href='https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transform hover:scale-105 transition duration-150"
                  >
                    <picture>
                      <source srcSet="/images/google-play-badge.webp" type="image/webp" />
                      <img 
                        alt={t('mobileApps.googlePlay')} 
                        src='/images/google-play-badge.png'
                        width={180}
                        height={100}
                        className="h-[100px] w-[180px] object-contain"
                      />
                    </picture>
                  </a>
                  
                  {/* App Store Button */}
                  <a
                    href="https://apps.apple.com/app/id6744860178"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transform hover:scale-105 transition duration-150"
                  >
                    <Image 
                      alt={t('mobileApps.appStore')} 
                      src='/images/app-store-badge.svg'
                      width={180}
                      height={50}
                      className="h-[50px] w-[180px] object-contain"
                    />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 