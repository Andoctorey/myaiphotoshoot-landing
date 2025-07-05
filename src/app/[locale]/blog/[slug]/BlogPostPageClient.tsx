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
        /* CSS Variables for theme colors */
        :root {
          --article-text: #242424;
          --article-heading: #1a1a1a;
          --article-link: #0066cc;
          --article-accent: #0066cc;
          --article-bg-special: #f8f9fa;
          --article-text-muted: #4a5568;
        }

        html.dark {
          --article-text: #e4e4e7;
          --article-heading: #f4f4f5;
          --article-link: #60a5fa;
          --article-accent: #3b82f6;
          --article-bg-special: #1e293b;
          --article-text-muted: #cbd5e1;
        }

        /* Base article styling */
        .medium-style-article {
          font-family: Georgia, Charter, "Times New Roman", serif !important;
          line-height: 1.75 !important;
          color: var(--article-text) !important;
          font-size: 20px !important;
          letter-spacing: -0.003em !important;
          max-width: none !important;
        }

        /* Comprehensive dark mode override */
        html.dark .medium-style-article,
        html.dark .medium-style-article * {
          color: var(--article-text) !important;
        }

        /* Typography */
        .medium-style-article h1,
        .medium-style-article h2,
        .medium-style-article h3,
        .medium-style-article h4,
        .medium-style-article h5,
        .medium-style-article h6 {
          color: var(--article-heading) !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }

        .medium-style-article h1 {
          font-size: 2.75rem !important;
          font-weight: 700 !important;
          line-height: 1.15 !important;
          margin-bottom: 1.5rem !important;
          letter-spacing: -0.02em !important;
        }

        .medium-style-article h2 {
          font-size: 2rem !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
          margin: 2.5rem 0 1.25rem !important;
          letter-spacing: -0.015em !important;
        }

        .medium-style-article h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          line-height: 1.35 !important;
          margin: 2rem 0 1rem !important;
          letter-spacing: -0.01em !important;
        }

        .medium-style-article h4 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin: 1.75rem 0 0.75rem !important;
        }

        .medium-style-article p {
          font-size: 20px !important;
          line-height: 1.75 !important;
          margin-bottom: 1.75rem !important;
          color: var(--article-text) !important;
          word-spacing: 0.05em !important;
        }

        .medium-style-article p:last-child {
          margin-bottom: 0 !important;
        }

        /* Special sections */
        .medium-style-article .section-importance {
          background: var(--article-bg-special) !important;
          border-left: 4px solid var(--article-accent) !important;
          padding: 1.25rem 1.75rem !important;
          margin: 2rem 0 !important;
          border-radius: 0 6px 6px 0 !important;
          font-size: 18px !important;
          font-style: italic !important;
          color: var(--article-text-muted) !important;
          line-height: 1.6 !important;
        }

        /* Photo Gallery Styles - Enhanced for better UX */
        .medium-style-article .photo-gallery {
          margin: 2.5rem 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 1.5rem 0 !important;
          width: 100% !important;
          -webkit-overflow-scrolling: touch !important;
          border-radius: 8px !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar {
          height: 8px !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px !important;
          border: 1px solid #e2e8f0 !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb {
          background: #94a3b8 !important;
          border-radius: 4px !important;
          border: 1px solid #64748b !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb:hover {
          background: #64748b !important;
        }

        .medium-style-article .photo-row {
          display: flex !important;
          gap: 1.5rem !important;
          padding-bottom: 1rem !important;
          width: max-content !important;
          min-width: 100% !important;
          flex-wrap: nowrap !important;
        }

        .medium-style-article .photo-item {
          flex: 0 0 auto !important;
          text-align: center !important;
          width: 320px !important;
          margin: 0 !important;
        }

        .medium-style-article .photo-item img {
          width: 320px !important;
          height: 320px !important;
          object-fit: cover !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          display: block !important;
          margin: 0 auto !important;
        }

        .medium-style-article .photo-item img:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
        }

        .medium-style-article .photo-item figcaption {
          margin-top: 0.75rem !important;
          font-size: 14px !important;
          color: #6b7280 !important;
          font-style: italic !important;
          line-height: 1.4 !important;
          max-width: 320px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }

        .medium-style-article .gallery-cta {
          margin-top: 0.75rem !important;
          text-align: center !important;
        }

        .medium-style-article .gallery-cta p {
          margin: 0 !important;
          font-size: 14px !important;
          color: #6b7280 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }

        /* Dark mode for captions */
        html.dark .medium-style-article .photo-item figcaption,
        html.dark .medium-style-article .gallery-cta p {
          color: #94a3b8 !important;
        }

        .medium-style-article blockquote {
          border-left: 4px solid var(--article-accent) !important;
          padding: 1.5rem 2rem !important;
          margin: 2.5rem 0 !important;
          font-style: italic !important;
          font-size: 22px !important;
          line-height: 1.6 !important;
          color: var(--article-text-muted) !important;
          background: var(--article-bg-special) !important;
          border-radius: 0 8px 8px 0 !important;
          position: relative !important;
        }

        .medium-style-article blockquote::before {
          content: """ !important;
          font-size: 3rem !important;
          color: var(--article-accent) !important;
          position: absolute !important;
          left: 0.5rem !important;
          top: -0.5rem !important;
          line-height: 1 !important;
        }

        /* Text styling */
        .medium-style-article strong {
          font-weight: 600 !important;
          color: var(--article-heading) !important;
        }

        .medium-style-article em {
          font-style: italic !important;
          color: var(--article-text) !important;
        }

        .medium-style-article a {
          color: var(--article-link) !important;
          text-decoration: none !important;
          border-bottom: 1px solid transparent !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
        }

        .medium-style-article a:hover {
          border-bottom-color: var(--article-link) !important;
          opacity: 0.8 !important;
        }

        /* Lists */
        .medium-style-article ul,
        .medium-style-article ol {
          margin: 2rem 0 !important;
          padding-left: 1.75rem !important;
          list-style: none !important;
        }

        .medium-style-article ol {
          counter-reset: item !important;
        }

        .medium-style-article ul li,
        .medium-style-article ol li {
          font-size: 20px !important;
          line-height: 1.75 !important;
          margin-bottom: 0.75rem !important;
          color: var(--article-text) !important;
          position: relative !important;
        }

        .medium-style-article ol li {
          counter-increment: item !important;
        }

        .medium-style-article ul li::before {
          content: "•" !important;
          color: var(--article-accent) !important;
          font-weight: bold !important;
          position: absolute !important;
          left: -1.25rem !important;
        }

        .medium-style-article ol li::before {
          content: counter(item) "." !important;
          color: var(--article-accent) !important;
          font-weight: 600 !important;
          position: absolute !important;
          left: -1.75rem !important;
        }



        /* Scrollbar styling */
        .medium-style-article .photo-gallery::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb {
          background: #94a3b8 !important;
          border: 1px solid #64748b !important;
        }

        .medium-style-article .photo-gallery::-webkit-scrollbar-thumb:hover {
          background: #64748b !important;
        }

        html.dark .medium-style-article .photo-gallery::-webkit-scrollbar-track {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
        }

        html.dark .medium-style-article .photo-gallery::-webkit-scrollbar-thumb {
          background: #64748b !important;
          border: 1px solid #94a3b8 !important;
        }

        html.dark .medium-style-article .photo-gallery::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
          border: 1px solid #cbd5e1 !important;
        }

        /* Modern CSS scrollbar colors for better browser support */
        .medium-style-article .photo-gallery {
          scrollbar-width: thin !important;
          scrollbar-color: #94a3b8 #f1f5f9 !important;
        }

        html.dark .medium-style-article .photo-gallery {
          scrollbar-color: #64748b #1e293b !important;
        }



        /* Responsive design */
        @media (max-width: 768px) {
          .medium-style-article {
            font-size: 18px !important;
          }

          .medium-style-article h1 {
            font-size: 2.25rem !important;
          }

          .medium-style-article h2 {
            font-size: 1.75rem !important;
          }

          .medium-style-article h3 {
            font-size: 1.375rem !important;
          }

          .medium-style-article p,
          .medium-style-article ul li,
          .medium-style-article ol li {
            font-size: 18px !important;
          }

          .medium-style-article blockquote {
            font-size: 20px !important;
            padding: 1.25rem 1.5rem !important;
          }
          
          .medium-style-article .photo-item {
            width: 280px !important;
          }
          
          .medium-style-article .photo-item img {
            width: 280px !important;
            height: 280px !important;
          }

          .medium-style-article .photo-item figcaption {
            max-width: 280px !important;
          }
        }

        @media (max-width: 480px) {
          .medium-style-article {
            font-size: 17px !important;
          }

          .medium-style-article h1 {
            font-size: 2rem !important;
          }

          .medium-style-article h2 {
            font-size: 1.5rem !important;
          }

          .medium-style-article p,
          .medium-style-article ul li,
          .medium-style-article ol li {
            font-size: 17px !important;
          }
          
          .medium-style-article .photo-item {
            width: 250px !important;
          }
          
          .medium-style-article .photo-item img {
            width: 250px !important;
            height: 250px !important;
          }

          .medium-style-article .photo-item figcaption {
            max-width: 250px !important;
          }
        }

        /* Reading flow improvements */
        .medium-style-article > * + * {
          margin-top: 0 !important;
        }

        .medium-style-article > p + p {
          margin-top: 1.75rem !important;
        }

        .medium-style-article > h2 + p,
        .medium-style-article > h3 + p,
        .medium-style-article > h4 + p {
          margin-top: 1rem !important;
        }

        /* Ensure proper box-sizing */
        .medium-style-article *,
        .medium-style-article *::before,
        .medium-style-article *::after {
          box-sizing: border-box !important;
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
              {/* Article Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-10 leading-tight">
                {post.title}
              </h1>

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