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
  const { post, isLoading, isError } = useBlogPost({ slug, locale });

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
    image: post.featured_image_url || 'https://myaiphotoshoot.com/images/default-blog-image.jpg',
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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

          {/* Back to Blog */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-200 group"
            >
              <ChevronLeftIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:block rtl:hidden" />
              <ChevronLeftIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:hidden rtl:block rotate-180" />
              <span className="text-lg font-semibold">{t('backToBlog')}</span>
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                <Image
                  src={post.featured_image_url}
                  alt={`Featured image for "${post.title}" - ${post.meta_description || 'AI Photography Blog Post'}`}
                  width={800}
                  height={450}
                  className="w-full h-64 md:h-80 object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
                />
              </div>
            )}

            <div className="p-8">
              {/* Article Meta */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <time dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
                {post.photo_topics && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{post.photo_topics}</span>
                  </>
                )}
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

              {/* Article Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Section Photos */}
              {post.section_photos && Object.keys(post.section_photos).length > 0 && (
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
              )}
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