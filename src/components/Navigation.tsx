'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations, useLocale } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/i18n/request';

export default function Navigation() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  
  const navItems = [
    { name: t('features'), href: '#features' },
    { name: t('gallery'), href: '#gallery' },
    { name: t('pricing'), href: '#pricing' },
  ];

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
  
  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Navigate to the same page with the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`, { scroll: false });
    
    // Close the language menu
    setIsLanguageMenuOpen(false);
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
              <span className="ml-2 text-lg font-medium text-gray-900 md:block">My AI Photo Shoot</span>
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#download"
                className="text-purple-600 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
              >
                {t('download')}
              </a>
              
              {/* Language selector dropdown */}
              <div className="relative">
                <button
                  className="flex items-center text-gray-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                >
                  <span className="uppercase">{locale}</span>
                  <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {locales.map((l) => (
                        <button
                          key={l}
                          onClick={() => handleLanguageChange(l)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            l === locale ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                          } hover:bg-purple-50 hover:text-purple-700`}
                          role="menuitem"
                        >
                          {l === 'en' ? 'English' : 'Русский'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
                  className="block text-gray-900 hover:text-primary px-3 py-2 rounded-md text-base font-medium transition-colors duration-150"
                  onClick={handleNavLinkClick}
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#download"
                className="block text-purple-600 hover:text-purple-800 px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 mt-2"
                onClick={handleNavLinkClick}
              >
                {t('download')}
              </a>
              
              {/* Language selector in mobile menu */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="px-2 space-y-1">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                        l === locale ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                      } hover:bg-purple-50 hover:text-purple-700`}
                    >
                      {l === 'en' ? 'English' : 'Русский'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </motion.header>
  );
} 