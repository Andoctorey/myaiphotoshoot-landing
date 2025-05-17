import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import Gallery from './Gallery';

const testimonials = [
  {
    content: "This app made my profile pictures stunning—can't believe these are AI-generated!",
    author: "Sarah Johnson",
    role: "Social Media Influencer",
    image: "/testimonial1.jpg"
  },
  {
    content: "Super fun to experiment with different styles. The variety is incredible!",
    author: "Mike Chen",
    role: "Professional Photographer",
    image: "/testimonial2.jpg"
  },
  {
    content: "Finally, an app that's transparent about pricing and respects my privacy. Highly recommended!",
    author: "Emma Davis",
    role: "Digital Creator",
    image: "/testimonial3.jpg"
  }
];

export default function Testimonials() {
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const { ref: galleryRef, inView: galleryInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-24 bg-gradient-to-b from-white to-purple-50" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            What Our Users Say
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Join thousands of satisfied users who have transformed their photos with AI
          </p>
        </div>

        <div
          ref={testimonialsRef}
          className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-xl relative"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="pt-6">
                <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Gallery Section */}
        <div ref={galleryRef} className="mt-24">
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