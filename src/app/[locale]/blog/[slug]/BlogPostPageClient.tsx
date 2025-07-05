'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useBlogPost } from '@/hooks/useBlog';
import { BlogPhoto } from '@/types/blog';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Props {
  slug: string;
  locale: string;
}

export default function BlogPostPageClient({ slug, locale }: Props) {
  const t = useTranslations('blog');
  const router = useRouter();
  const { post, isLoading, isError, error } = useBlogPost({ slug, locale });

  // Handle 404 if post is not found
  useEffect(() => {
    if (!isLoading && !post && !isError) {
      router.push(`/${locale}/blog`);
    }
  }, [isLoading, post, isError, router, locale]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: t('title'), href: '/blog' },
    { label: post?.title || slug, href: undefined },
  ];

  // Generate JSON-LD structured data
  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.title,
    image: post.featured_image_url || 'https://myaiphotoshoot.com/images/logo.png',
    author: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myaiphotoshoot.com/images/logo.png',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myaiphotoshoot.com/images/logo.png',
      },
    },
    datePublished: post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://myaiphotoshoot.com/${locale}/blog/${slug}`,
    },
    keywords: post.photo_topics || '',
    articleSection: 'AI Photography',
    inLanguage: locale,
    wordCount: post.content ? post.content.replace(/<[^>]*>/g, '').split(' ').length : 0,
  } : null;

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://myaiphotoshoot.com/${locale}${item.href}` : undefined,
    })),
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Loading blog post...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (isError || !post) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('notFound')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {t('errorDescription')}
              </p>
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                {t('backToBlog')}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* Add admin-style CSS with !important to override conflicts */}
      <style jsx global>{`
        .medium-style-article {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          line-height: 1.6 !important;
          color: #292929 !important;
          max-width: none !important;
        }

        .medium-style-article h1 {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          margin-bottom: 1rem !important;
          color: #292929 !important;
        }

        .medium-style-article h2 {
          font-size: 1.875rem !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
          color: #292929 !important;
        }

        .medium-style-article h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          color: #292929 !important;
        }

        .medium-style-article p {
          font-size: 1.125rem !important;
          line-height: 1.6 !important;
          margin-bottom: 1.5rem !important;
          color: #292929 !important;
        }

        .medium-style-article .section-importance {
          background: #f8f9fa !important;
          border-left: 4px solid #1a8917 !important;
          padding: 1rem 1.5rem !important;
          margin: 1.5rem 0 !important;
          border-radius: 0 8px 8px 0 !important;
          font-size: 1rem !important;
          font-style: italic !important;
          color: #4a5568 !important;
        }

        /* Photo Gallery Styles - CRITICAL for horizontal layout */
        .medium-style-article .photo-gallery {
          margin: 2rem 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 1rem 0 !important;
          width: 100% !important;
          -webkit-overflow-scrolling: touch !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar {
          height: 8px !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-track {
          background: #f1f1f1 !important;
          border-radius: 10px !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb {
          background: #c1c1c1 !important;
          border-radius: 10px !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8 !important;
        }

        .medium-style-article .photo-row {
          display: flex !important;
          gap: 1rem !important;
          padding-bottom: 0.5rem !important;
          width: max-content !important;
          min-width: 100% !important;
          flex-wrap: nowrap !important;
        }

        .medium-style-article .photo-item {
          flex: 0 0 auto !important;
          text-align: center !important;
          width: 300px !important;
          margin: 0 !important;
        }

        .medium-style-article .photo-item img {
          width: 300px !important;
          height: 300px !important;
          object-fit: cover !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          cursor: pointer !important;
          display: block !important;
          margin: 0 auto !important;
        }

        .medium-style-article .photo-item img:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
        }

        .medium-style-article .photo-item figcaption {
          margin-top: 0.5rem !important;
          font-size: 0.75rem !important;
          color: #6b6b6b !important;
          font-style: italic !important;
          line-height: 1.3 !important;
          max-width: 300px !important;
        }

        .medium-style-article .gallery-cta {
          margin-top: 0.5rem !important;
          text-align: center !important;
        }

        .medium-style-article .gallery-cta p {
          margin: 0 !important;
          font-size: 0.9rem !important;
          color: #666 !important;
        }

        .medium-style-article blockquote {
          border-left: 4px solid #1a8917 !important;
          padding: 1rem 1.5rem !important;
          margin: 2rem 0 !important;
          font-style: italic !important;
          font-size: 1.125rem !important;
          color: #292929 !important;
          background: #f8f9fa !important;
          border-radius: 0 4px 4px 0 !important;
        }

        .medium-style-article strong {
          font-weight: 600 !important;
          color: #292929 !important;
        }

        .medium-style-article em {
          font-style: italic !important;
          color: #292929 !important;
        }

        .medium-style-article a {
          color: #1a8917 !important;
          text-decoration: none !important;
          border-bottom: 1px solid transparent !important;
          transition: border-bottom-color 0.2s ease !important;
        }

        .medium-style-article a:hover {
          border-bottom-color: #1a8917 !important;
        }

        .medium-style-article ul {
          margin: 1.5rem 0 !important;
          padding-left: 1.5rem !important;
          list-style-type: disc !important;
        }

        .medium-style-article ul li {
          font-size: 1.125rem !important;
          line-height: 1.6 !important;
          margin-bottom: 0.5rem !important;
          color: #292929 !important;
        }

        .medium-style-article ol {
          margin: 1.5rem 0 !important;
          padding-left: 1.5rem !important;
          list-style-type: decimal !important;
        }

        .medium-style-article ol li {
          font-size: 1.125rem !important;
          line-height: 1.6 !important;
          margin-bottom: 0.5rem !important;
          color: #292929 !important;
        }

        /* Dark mode styles */
        .dark .medium-style-article {
          color: #e2e8f0 !important;
        }
        
        .dark .medium-style-article h1,
        .dark .medium-style-article h2,
        .dark .medium-style-article h3 {
          color: #f8fafc !important;
        }
        
        .dark .medium-style-article p {
          color: #e2e8f0 !important;
        }
        
        .dark .medium-style-article .section-importance {
          background: #1a202c !important;
          color: #a0aec0 !important;
        }
        
        .dark .medium-style-article blockquote {
          background: #1a202c !important;
          color: #e2e8f0 !important;
        }
        
        .dark .medium-style-article .gallery-cta p {
          color: #a0aec0 !important;
        }

        .dark .medium-style-article ul li,
        .dark .medium-style-article ol li {
          color: #e2e8f0 !important;
        }

        .dark .medium-style-article strong {
          color: #f8fafc !important;
        }

        /* Ensure images maintain pointer cursor since they're clickable */
        .medium-style-article .photo-item img[title] {
          cursor: pointer !important;
        }

        /* Override any conflicting display styles */
        .medium-style-article * {
          box-sizing: border-box !important;
        }





        /* Additional mobile responsive styles */
        @media (max-width: 768px) {
          .medium-style-article .photo-item {
            width: 250px !important;
          }
          
          .medium-style-article .photo-item img {
            width: 250px !important;
            height: 250px !important;
          }
        }
      `}</style>
      
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navigation />
      <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />



          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >


            <div className="p-8">
              {/* Article Meta */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <time dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
              </div>

              {/* Article Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {post.title}
              </h1>

              {/* Article Description */}
              {post.meta_description && (
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium">
                  {post.meta_description}
                </p>
              )}

              {/* Article Content - Using admin's medium-style-article class */}
              <div className="medium-style-article">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Section Photos - Commented out since photos are now in content HTML */}
              {/* {post.section_photos && Object.keys(post.section_photos).length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Featured Photos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(post.section_photos).map(([key, photos]: [string, BlogPhoto | BlogPhoto[]]) => (
                      <div key={key} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        {Array.isArray(photos) ? (
                          <div className="grid grid-cols-1 gap-4">
                            {Array.isArray(photos) && photos.map((photo: BlogPhoto, index: number) => (
                              <div key={index} className="rounded-lg overflow-hidden">
                                <Image
                                  src={photo.url}
                                  alt={photo.alt || `${key.replace(/([A-Z])/g, ' $1').trim()} example photo ${index + 1} from "${post.title}" blog post`}
                                  width={400}
                                  height={300}
                                  className="w-full h-48 object-cover"
                                  loading="lazy"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                                  placeholder="blur"
                                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
                                />
                                {photo.caption && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg overflow-hidden">
                            <Image
                              src={typeof photos === 'string' ? photos : photos.url}
                              alt={typeof photos === 'string' ? `${key.replace(/([A-Z])/g, ' $1').trim()} example photo from "${post.title}" blog post` : (photos.alt || `${key.replace(/([A-Z])/g, ' $1').trim()} example photo from "${post.title}" blog post`)}
                              width={400}
                              height={300}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                              placeholder="blur"
                              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
                            />
                            {typeof photos !== 'string' && photos.caption && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {photos.caption}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </motion.article>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Create Your Own AI Photos?
            </h2>
            <p className="text-purple-100 mb-6">
              Transform your photos into stunning AI-generated images with our advanced technology.
            </p>
            <a
              href="https://app.myaiphotoshoot.com"
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Creating Now
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
} 