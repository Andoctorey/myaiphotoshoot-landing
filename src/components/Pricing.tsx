import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CheckIcon } from '@heroicons/react/24/outline';

const features = [
  'AI model training',
  'Unlimited photo generation',
  'Custom photo prompts',
  'Public/private gallery options',
  'Social sharing features',
  'Download in high resolution',
  '24/7 customer support',
  'Regular AI model updates',
];

export default function Pricing() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            No hidden fees, no subscriptions. Pay only for what you use.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mt-20 max-w-lg mx-auto rounded-2xl shadow-xl overflow-hidden lg:max-w-none lg:flex"
        >
          <div className="flex-1 bg-white px-6 py-8 lg:p-12">
            <h3 className="text-2xl font-bold text-gray-900">Pay As You Go</h3>
            <p className="mt-6 text-base text-gray-500">
              Perfect for anyone who wants to create stunning AI-generated photos without commitments.
            </p>
            <div className="mt-8">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 pr-4 text-base font-semibold text-purple-600">
                  What's included
                </h4>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <ul className="mt-8 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start lg:col-span-1">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-sm text-gray-700">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="py-8 px-6 text-center bg-gray-50 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12">
            <div className="mt-4 flex items-center justify-center text-5xl font-extrabold text-gray-900">
              <span>$0.03</span>
              <span className="ml-3 text-xl font-medium text-gray-500">per photo</span>
            </div>
            <div className="mt-6">
              <div className="rounded-md shadow">
                <a
                  href="#download-options"
                  className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Get started
                </a>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p className="font-medium text-gray-900">One-time AI training fee:</p>
              <p className="text-gray-500">Starting from $4.99</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 