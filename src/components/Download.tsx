import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Download() {
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
    <section id="download" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Get Started Today
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Download our app and create stunning AI photos in minutes
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
              className="relative h-[600px] w-[300px] rounded-[36px] overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300"
            >
              <Image
                src="/images/screenshot_1.jpg"
                alt="MyAIPhotoShoot App"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover"
                priority
              />
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
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Platform</h3>
              
              {/* Web App */}
              <div className="mb-8 text-center">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Web App</h4>
                <p className="text-gray-600 mb-4">Use directly in your browser, no installation required</p>
                <a
                  href="https://app.myaiphotoshoot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition duration-150 ease-in-out"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Launch Web App
                </a>
              </div>
              
              {/* Mobile Apps */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Mobile Apps</h4>
                <p className="text-gray-600 mb-4">Download our native apps for the best experience</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start items-center">
                  {/* Google Play Button */}
                  <a 
                    href='https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transform hover:scale-105 transition duration-150"
                  >
                    <img 
                      alt='Get it on Google Play' 
                      src='/images/google-play-badge.png'
                      className="h-[100px] w-[180px] object-contain"
                    />
                  </a>
                  
                  {/* App Store Button */}
                  <a
                    href="https://apps.apple.com/app/id6744860178"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transform hover:scale-105 transition duration-150"
                  >
                    <img 
                      alt='Download on the App Store' 
                      src='/images/app-store-badge.svg'
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