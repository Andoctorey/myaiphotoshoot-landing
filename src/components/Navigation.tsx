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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking on a link
  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

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
              <span className="ml-2 text-lg font-medium text-on-surface md:block">My AI Photo Shoot</span>
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
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-on-surface hover:text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-surface/90 backdrop-blur-md rounded-md mt-2 shadow-lg">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-on-surface hover:text-primary px-3 py-2 rounded-md text-base font-medium transition-colors duration-150"
                  onClick={handleNavLinkClick}
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#download"
                className="block text-on-surface hover:text-primary px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-on hover:bg-primary-dark hover:text-primary-on-dark transition-colors duration-150"
                onClick={handleNavLinkClick}
              >
                Download Now
              </a>
            </div>
          </div>
        )}
      </nav>
    </motion.header>
  );
} 