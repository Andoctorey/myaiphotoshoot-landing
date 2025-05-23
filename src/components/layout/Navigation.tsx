'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from '@/lib/utils';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales } from '@/i18n/request';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navigation() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  
  // Check if we're on the home page
  const isHomePage = pathname === '/' || pathname === `/${locale}`;
  
  // Language display names
  const getLanguageDisplayName = (langCode: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'zh': '中文',
      'hi': 'हिन्दी',
      'es': 'Español',
      'de': 'Deutsch',
      'ja': '日本語',
      'ru': 'Русский',
      'fr': 'Français',
      'ar': 'العربية'
    };
    return languageNames[langCode] || langCode;
  };

  const navItems = [
    { name: t('features'), href: isHomePage ? '#features' : `/${locale}#features` },
    { name: t('gallery'), href: isHomePage ? '#gallery' : `/${locale}#gallery` },
    { name: t('pricing'), href: isHomePage ? '#pricing' : `/${locale}#pricing` },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add event listener for ESC key to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLanguageMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add click outside listener to close language menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        languageMenuRef.current &&
        languageButtonRef.current &&
        !languageMenuRef.current.contains(e.target as Node) &&
        !languageButtonRef.current.contains(e.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  // Close mobile menu when clicking on a link
  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };
  
  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    // Navigate to the same page with the new locale using static-compatible router
    router.push(pathname, { locale: newLocale, scroll: false });
    
    // Close the language menu
    setIsLanguageMenuOpen(false);
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 bg-white/0 dark:bg-black/80 backdrop-blur-sm data-[scrolled=true]:bg-white/80 data-[scrolled=true]:dark:bg-gray-900/80 data-[scrolled=true]:backdrop-blur-md data-[scrolled=true]:shadow-sm data-[scrolled=true]:dark:shadow-gray-900"
      data-scrolled={isScrolled}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a 
              href={isHomePage ? "#" : `/${locale}`} 
              className="flex items-center"
              aria-label="My AI Photo Shoot - Home"
            >
              <div className="h-11 w-11 relative">
                <picture>
                  <source srcSet="/images/icon_192.webp" type="image/webp" />
                  <img 
                    src="/images/icon_192.png" 
                    alt="My AI Photo Shoot logo" 
                    className="h-full w-auto"
                  />
                </picture>
              </div>
              <span className="ltr:ml-2 rtl:mr-2 text-lg font-medium text-gray-900 dark:text-white md:block">
                My AI Photo Shoot
              </span>
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ltr:ml-10 rtl:mr-10 flex items-center ltr:space-x-4 rtl:space-x-reverse" role="navigation">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-gray-900 dark:text-white hover:text-primary dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  {item.name}
                </a>
              ))}
              <a
                href={isHomePage ? "#download" : `/${locale}#download`}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {t('download')}
              </a>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Language selector dropdown */}
              <div className="relative">
                <button
                  ref={languageButtonRef}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-gray-900 dark:text-white hover:text-primary dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  aria-expanded={isLanguageMenuOpen}
                  aria-haspopup="listbox"
                  aria-controls="language-menu"
                >
                  <span className="uppercase">{locale}</span>
                  <svg className="ltr:ml-1 rtl:mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isLanguageMenuOpen && (
                  <div 
                    ref={languageMenuRef}
                    id="language-menu"
                    className="absolute ltr:right-0 rtl:left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50"
                    role="listbox"
                    aria-labelledby="language-dropdown"
                  >
                    <div className="py-1" role="presentation">
                      {locales.map((l) => (
                        <button
                          key={l}
                          onClick={() => handleLanguageChange(l)}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors duration-150 ${
                            l === locale 
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                              : 'text-gray-700 dark:text-gray-300'
                          } hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300 focus:outline-none focus:bg-purple-50 dark:focus:bg-purple-900/50 focus:text-purple-700 dark:focus:text-purple-300`}
                          role="option"
                          aria-selected={l === locale}
                          tabIndex={0}
                        >
                          <span className="flex-1 ltr:text-left rtl:text-right">{getLanguageDisplayName(l)}</span>
                          <span className="ltr:ml-2 rtl:mr-2 text-xs text-gray-500 dark:text-gray-400 uppercase">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                isScrolled
                  ? 'text-gray-900 hover:text-primary dark:text-gray-100 dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-900 hover:text-primary dark:text-white dark:hover:text-purple-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="sr-only">
                {mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              </span>
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
          <div id="mobile-menu" className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md mt-2 shadow-lg dark:shadow-gray-900" role="menu">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  onClick={handleNavLinkClick}
                  role="menuitem"
                >
                  {item.name}
                </a>
              ))}
              <a
                href={isHomePage ? "#download" : `/${locale}#download`}
                className="block text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 mt-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={handleNavLinkClick}
                role="menuitem"
              >
                {t('download')}
              </a>
              
              {/* Language selector in mobile menu */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700" role="group" aria-label="Language selection">
                <div className="px-2 space-y-1">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${
                        l === locale 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      } hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                      aria-pressed={l === locale}
                    >
                      <span className="flex-1 ltr:text-left rtl:text-right">{getLanguageDisplayName(l)}</span>
                      <span className="ltr:ml-2 rtl:mr-2 text-sm text-gray-500 dark:text-gray-400 uppercase">{l}</span>
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