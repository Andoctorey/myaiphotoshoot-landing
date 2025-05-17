import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Pricing', href: '#pricing' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-surface/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="#" className="flex items-center">
              <Image 
                src="/images/icon_192.png" 
                alt="My AI Photo Shoot" 
                width={44} 
                height={44} 
                className="h-11 w-auto"
                priority
              />
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-on-surface hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#download"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-on bg-primary hover:bg-primary-dark hover:text-primary-on-dark transition duration-150 ease-in-out"
              >
                Download Now
              </a>
            </div>
          </div>
        </div>
      </nav>
    </motion.header>
  );
} 