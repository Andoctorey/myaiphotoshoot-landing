import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

export default function Download() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

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
          {/* App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-end relative"
          >
            <div className="relative h-[600px] w-[300px] rounded-[36px] overflow-hidden border-8 border-gray-800 shadow-xl">
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/30 to-transparent opacity-40 pointer-events-none" />
              <div className="absolute top-0 w-[120px] h-[30px] bg-gray-800 left-1/2 -translate-x-1/2 rounded-b-[14px] z-10" />
              <Image
                src="/images/screenshot_1.jpg"
                alt="MyAIPhotoShoot App"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Download Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center lg:items-start"
          >
            {/* Platform options */}
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Platform</h3>
              
              {/* Web App */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Web App</h4>
                <p className="text-gray-600 mb-4">Use directly in your browser, no installation required</p>
                <a
                  href="https://app.myaiphotoshoot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition duration-150 ease-in-out"
                >
                  Launch Web App
                </a>
              </div>
              
              {/* Mobile Apps */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Mobile Apps</h4>
                <p className="text-gray-600 mb-4">Download our native apps for the best experience</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
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
                      className="h-[48px] w-auto"
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
                      className="h-[48px] w-auto"
                    />
                  </a>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md w-full">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-gray-700">Fast generation</span>
              </div>
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-gray-700">High quality</span>
              </div>
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-gray-700">Secure storage</span>
              </div>
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-gray-700">Easy sharing</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 