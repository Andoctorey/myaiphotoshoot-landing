import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Footer() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">My AI Photo Shoot</h3>
            <p className="text-gray-400 mb-4">
              Transform your selfies into stunning AI-generated photos with our cutting-edge technology.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/legal" className="text-gray-400 hover:text-white transition-colors">
                  Legal Information
                </a>
              </li>
              <li>
                <a 
                  href="https://x.com/andoctorey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Twitter (X) - Feature requests & bug reports
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} My AI Photo Shoot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 