import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  CameraIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Easy Selfie Upload',
    description: 'Upload 10-20 selfies easily from your phone or social media. Vary your angles and expressions for best results.',
    icon: CameraIcon,
  },
  {
    name: 'Advanced AI Technology',
    description: 'Powered by Flux.1, delivering exceptional photo realism and creative detail in every image.',
    icon: SparklesIcon,
  },
  {
    name: 'Privacy First',
    description: 'Control your data with public/private gallery options and permanent deletion whenever you choose.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Affordable Pricing',
    description: 'Clear one-time AI training cost and just $0.03 per generated photo. No hidden fees or subscriptions.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Thousands of Styles',
    description: 'Generate thousands of unique photos with our "Surprise Me!" feature and custom photo prompts.',
    icon: PhotoIcon,
  },
  {
    name: 'Easy Customization',
    description: 'Enhance your prompts for personalized outcomes and create similar masterpieces from public photos.',
    icon: AdjustmentsHorizontalIcon,
  },
];

export default function Features() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="features" className="py-12 bg-white">
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
              className="relative p-6 bg-white rounded-2xl shadow-xl border border-gray-100 hover:border-purple-100 transition-colors duration-300"
            >
              <div className="absolute top-6 left-6">
                <feature.icon
                  className="h-8 w-8 text-purple-600"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-16">
                <h3 className="text-xl font-medium text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-base text-gray-500">
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