'use client';

import Image from 'next/image'
import Link from 'next/link'
import { GalleryItem } from '@/types/gallery'
import Script from 'next/script'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface PhotoPageClientProps {
  photo: GalleryItem;
  prev: GalleryItem | null;
  next: GalleryItem | null;
  locale: string;
  showNavigation?: boolean;
}

export default function PhotoPageClient({ photo, prev, next, locale, showNavigation = true }: PhotoPageClientProps) {
  const photoRef = useRef<HTMLDivElement>(null);

  const scrollToPhoto = () => {
    if (photoRef.current) {
      const headerOffset = 80; // Approximate header height
      const elementPosition = photoRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToPhoto();
  }, [photo.id]); // Scroll when photo changes

  const handleBackToGallery = () => {
    // Store scroll intent in sessionStorage
    sessionStorage.setItem('scrollToGallery', 'true');
    // Navigate to home page
    window.location.href = `/${locale}/#gallery`;
  };

  // Create JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `https://myaiphotoshoot.com/photo/${photo.id}`,
    url: `https://myaiphotoshoot.com/photo/${photo.id}`,  
    contentUrl: photo.public_url,
    name: photo.prompt,
    headline: photo.prompt.substring(0, 110), // Google's recommended headline length
    description: photo.prompt,
    datePublished: photo.created_at,
    dateModified: photo.created_at,
    uploadDate: photo.created_at,
    author: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com'
    },
    creator: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myaiphotoshoot.com/images/favicon.png'
      }
    },
    // Essential image properties
    width: '1024',
    height: '1024',
    encodingFormat: 'image/jpeg',
    // Licensing and rights
    license: 'https://myaiphotoshoot.com/license',
    acquireLicensePage: 'https://myaiphotoshoot.com/license',
    copyrightHolder: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot'
    },
    copyrightNotice: '© 2025 My AI Photo Shoot. Generated with AI.',
    // Keywords extracted from prompt
    keywords: photo.prompt.split(/[\s,]+/).filter(word => word.length > 3).slice(0, 15).join(', '),
    // Context about AI generation
    additionalType: 'https://schema.org/DigitalDocument',
    genre: 'AI Photography',
    inLanguage: 'en-US',
    // Main entity reference
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://myaiphotoshoot.com/photo/${photo.id}`
    }
  }

  // Add breadcrumb structured data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://myaiphotoshoot.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'AI Photo Gallery',
        item: 'https://myaiphotoshoot.com/#gallery'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'AI Generated Photo',
        item: `https://myaiphotoshoot.com/photo/${photo.id}`
      }
    ]
  }

  // Add FAQ structured data for common AI photo questions
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How was this photo created?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This professional photo was generated using advanced artificial intelligence technology based on the prompt: "' + photo.prompt + '". Our AI system creates realistic, high-quality images from text descriptions.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use this AI-generated photo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This AI-generated photo is available for use under our licensing terms. Visit our license page for complete usage rights and restrictions.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can I create a similar photo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can create your own professional AI photos by visiting our app at https://app.myaiphotoshoot.com. Simply upload your photos and describe what you want to create.'
        }
      }
    ]
  }

  return (
    <>
      <Script
        id="photo-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back to Gallery Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={handleBackToGallery}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 group"
            >
              <ChevronLeftIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:block rtl:hidden" />
              <ChevronRightIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:hidden rtl:block" />
              <span className="text-lg font-semibold">Back to Gallery</span>
            </button>
            <div className="text-center mt-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My AI Photo Shoot
              </h1>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
          >
            <div ref={photoRef} className="relative aspect-square w-full group">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative w-full h-full"
              >
                <Image
                  src={photo.public_url}
                  alt={photo.prompt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
              
              {/* Navigation Arrows - Desktop */}
              {showNavigation && (
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 hidden md:flex"
                  >
                    {prev && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Link
                          href={`/photo/${prev.id}`}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors duration-200"
                          aria-label="Previous Photo"
                        >
                          <ChevronLeftIcon className="h-5 w-5 ltr:block rtl:hidden" />
                          <ChevronRightIcon className="h-5 w-5 ltr:hidden rtl:block" />
                        </Link>
                      </motion.div>
                    )}
                    {next && (
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Link
                          href={`/photo/${next.id}`}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors duration-200"
                          aria-label="Next Photo"
                        >
                          <ChevronRightIcon className="h-5 w-5 ltr:block rtl:hidden" />
                          <ChevronLeftIcon className="h-5 w-5 ltr:hidden rtl:block" />
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Mobile Navigation */}
              {showNavigation && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="md:hidden absolute inset-x-0 bottom-0 flex justify-between items-center px-4 py-4 bg-gradient-to-t from-black/50 to-transparent"
                >
                  {prev && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={`/photo/${prev.id}`}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors duration-200"
                        aria-label="Previous Photo"
                      >
                        <ChevronLeftIcon className="h-5 w-5 ltr:block rtl:hidden" />
                        <ChevronRightIcon className="h-5 w-5 ltr:hidden rtl:block" />
                      </Link>
                    </motion.div>
                  )}
                  {next && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={`/photo/${next.id}`}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors duration-200"
                        aria-label="Next Photo"
                      >
                        <ChevronRightIcon className="h-5 w-5 ltr:block rtl:hidden" />
                        <ChevronLeftIcon className="h-5 w-5 ltr:hidden rtl:block" />
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6"
            >
              {/* Improved prompt display with better SEO structure */}
              <article className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <header>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    AI Generation Prompt
                  </h2>
                </header>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {photo.prompt}
                  </p>
                </div>
                {/* Add context for search engines */}
                <footer className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Professional AI-generated photo created with advanced artificial intelligence technology
                  </p>
                </footer>
              </article>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center mt-4"
              >
                <Link
                  href={`https://app.myaiphotoshoot.com`}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 transition-colors duration-200"
                  aria-label="Create a similar AI-generated photo"
                >
                  Create Similar Photo
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  )
}