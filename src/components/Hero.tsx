import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="pt-24 pb-4 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Selfies Into
              <span className="text-purple-600"> Stunning AI Photos</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-4">
              Create thousands of professional, AI-enhanced photos perfect for social media,
              profile pictures, or creative projects!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 