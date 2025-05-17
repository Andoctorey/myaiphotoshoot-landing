import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Gallery from './Gallery';

export default function UserGallery() {
  const { ref: galleryRef, inView: galleryInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-24 bg-gradient-to-b from-white to-purple-50" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Section */}
        <div ref={galleryRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              User Gallery
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Real AI-generated photos created by our users
            </p>
          </motion.div>
          
          <Gallery />
        </div>
      </div>
    </section>
  );
} 