import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Download() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="download" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-8">
            Download Our App
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <a
                href="https://app.myaiphotoshoot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition duration-150 ease-in-out w-64 mx-auto mb-6"
              >
                Try Web App
              </a>
              
              <p className="text-xl text-gray-600 mb-6">Download Mobile Apps:</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Google Play Button */}
                <a 
                  href='https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-40"
                >
                  <img 
                    alt='Get it on Google Play' 
                    src='/images/google-play-badge.png'
                    className="w-full"
                  />
                </a>
                
                {/* App Store Button */}
                <a
                  href="https://apps.apple.com/app/id6744860178"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-36"
                >
                  <img 
                    alt='Download on the App Store' 
                    src='/images/app-store-badge.svg'
                    className="w-full"
                  />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 