'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { useBlogPosts } from '@/hooks/useBlog';
import { BlogListItem } from '@/types/blog';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type Props = {
  locale: string;
};

export default function BlogPageClient({ locale }: Props) {
  const t = useTranslations('blog');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const { posts, pagination, isLoading, isError } = useBlogPosts({
    page: currentPage,
    limit: postsPerPage,
    locale,
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* CollectionPage JSON-LD for the blog listing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('title'),
            description: t('description'),
            url: `https://myaiphotoshoot.com/${locale}/blog`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com'
            },
            hasPart: posts.slice(0, 10).map((p) => ({
              '@type': 'BlogPosting',
              headline: p.title,
              url: `https://myaiphotoshoot.com/${locale}/blog/${p.slug}`,
              datePublished: p.created_at,
              image: p.featured_image_url || undefined
            }))
          })
        }}
      />
      <Navigation />
      <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              {t('description')}
            </motion.p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 text-lg">
                {t('errorTitle')}. {t('errorDescription')}
              </p>
            </div>
          )}

          {/* Blog Posts Grid */}
          {!isLoading && !isError && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post: BlogListItem, index: number) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <Link href={`/${locale}/blog/${post.slug}`}>
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700">
                      {post.featured_image_url ? (
                        <Image
                          src={post.featured_image_url}
                          alt={`Featured image for blog post: ${post.title}`}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {post.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        {post.title}
                      </h2>
                      {post.meta_description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {post.meta_description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('noPostsTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('noPostsDescription')}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center space-x-2"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 ltr:mr-2 rtl:ml-2 ltr:block rtl:hidden" />
                <ChevronRightIcon className="h-5 w-5 ltr:mr-2 rtl:ml-2 ltr:hidden rtl:block" />
                {t('previous')}
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('next')}
                <ChevronRightIcon className="h-5 w-5 ltr:ml-2 rtl:mr-2 ltr:block rtl:hidden" />
                <ChevronLeftIcon className="h-5 w-5 ltr:ml-2 rtl:mr-2 ltr:hidden rtl:block" />
              </button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
} 