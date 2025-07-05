'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useBlogPost } from '@/hooks/useBlog';
import { BlogPost } from '@/types/blog';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface BlogPostPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const { slug } = params;

  const { post, isLoading, isError } = useBlogPost({
    slug,
    locale,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Redirect to 404 if post not found
  useEffect(() => {
    if (!isLoading && !post && !isError) {
      router.push('/404');
    }
  }, [isLoading, post, isError, router]);

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

  if (isError || !post) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 text-lg">
                Failed to load blog post. Please try again later.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title, href: undefined },
  ];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description,
    image: post.featured_image_url || 'https://myaiphotoshoot.com/images/default-blog-image.jpg',
    author: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com',
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
      '@id': `https://myaiphotoshoot.com/blog/${post.slug}`,
    },
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://myaiphotoshoot.com${item.href}` : undefined,
    })),
  };

  return (
    <>
      <Script
        id="blog-post-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
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
              href="/blog"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-200 group"
            >
              <ChevronLeftIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:block rtl:hidden" />
              <ChevronLeftIcon className="h-5 w-5 transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1 ltr:hidden rtl:block rotate-180" />
              <span className="text-lg font-semibold">Back to Blog</span>
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
                  alt={post.title}
                  width={800}
                  height={450}
                  className="w-full h-64 md:h-80 object-cover"
                  priority
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
                    {Object.entries(post.section_photos).map(([key, photos]: [string, any]) => (
                      <div key={key} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        {Array.isArray(photos) ? (
                          <div className="grid grid-cols-1 gap-4">
                            {photos.map((photo: any, index: number) => (
                              <div key={index} className="rounded-lg overflow-hidden">
                                <Image
                                  src={photo.url || photo}
                                  alt={photo.alt || `${key} photo ${index + 1}`}
                                  width={400}
                                  height={300}
                                  className="w-full h-48 object-cover"
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
                              src={photos.url || photos}
                              alt={photos.alt || `${key} photo`}
                              width={400}
                              height={300}
                              className="w-full h-48 object-cover"
                            />
                            {photos.caption && (
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