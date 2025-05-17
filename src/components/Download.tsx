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
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Google Play Button */}
                <a 
                  href='https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    alt='Get it on Google Play' 
                    src='/images/google-play-badge.png'
                    className="h-14"
                  />
                </a>
                
                {/* App Store Button - Following Apple brand guidelines */}
                <a
                  href="https://apps.apple.com/app/id6744860178"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors duration-150 w-48 h-14"
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor">
                        <path d="M16.766 12.878c-.021-2.34 1.921-3.477 2.008-3.531-1.098-1.604-2.798-1.823-3.4-1.845-1.441-.149-2.817.853-3.546.853-.736 0-1.866-.837-3.069-.813-1.56.023-3.013.913-3.815 2.311-1.64 2.844-.416 7.035 1.161 9.339.787 1.129 1.715 2.393 2.931 2.348 1.182-.049 1.627-.758 3.057-.758 1.422 0 1.836.758 3.077.732 1.273-.021 2.08-1.149 2.849-2.29.911-1.314 1.281-2.601 1.3-2.668-.029-.011-2.482-.95-2.502-3.779M13.629 3.869c.641-.785 1.08-1.866.961-2.949-.928.039-2.089.624-2.755 1.394-.593.691-1.125 1.819-.985 2.885 1.04.079 2.111-.519 2.779-1.33"/>
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs">Download on the</span>
                      <span className="text-base font-medium">App Store</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 