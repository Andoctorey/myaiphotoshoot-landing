'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TableOfContents from '@/components/blog/TableOfContents';
import FAQSchema, { extractFAQsFromContent } from '@/components/blog/FAQSchema';
import { useBlogPost } from '@/hooks/useBlog';
import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import type { BlogPost } from '@/types/blog';
import { withDefaultCdnWidth } from '@/lib/image';

interface Props {
  slug: string;
  locale: string;
  initialPost?: BlogPost;
}

// Utility function to calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Utility function to format date
const formatDate = (dateString: string, locale: string) => {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function BlogPostPageClient({ slug, locale, initialPost }: Props) {
  const t = useTranslations('blog');
  const router = useRouter();
  const { post, isLoading, isError } = useBlogPost({ slug, locale, fallbackData: initialPost });
  // Ensure blog content images append ?width=420 similar to KMP logic
  const addWidthParamToImages = (html: string): string => {
    if (!html) return html;
    return html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi, (match, preAttrs, src, postAttrs) => {
      try {
        // Skip data URIs and non-http(s) relative paths
        if (!/^https?:\/\//i.test(src)) {
          return match;
        }
        // Skip supabase direct URLs
        if (src.includes('supabase.co')) {
          return match;
        }
        // Skip if width param already present
        if (/([?&])width=\d+/i.test(src)) {
          return match;
        }
        const separator = src.includes('?') ? '&' : '?';
        const updatedSrc = `${src}${separator}width=420`;
        return `<img ${preAttrs}src="${updatedSrc}"${postAttrs}>`;
      } catch {
        return match;
      }
    });
  };

  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    const withWidth = addWidthParamToImages(post.content);
    return withWidth.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
      if (/\salt=(["']).*?\1/i.test(attrs)) {
        return `<img ${attrs}>`;
      }
      const safeAlt = post.title?.slice(0, 120) || 'Blog image';
      return `<img ${attrs} alt="${safeAlt}">`;
    });
  }, [post?.content, post?.title]);


  // Extract FAQs from content for schema markup
  const faqs = post ? extractFAQsFromContent(post.content) : [];

  // Handle 404 if post is not found
  useEffect(() => {
    if (!isLoading && !post && !isError) {
      router.push(`/${locale}/blog`);
    }
  }, [isLoading, post, isError, router, locale]);

  // Generate JSON-LD structured data
  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.title,
    url: `https://myaiphotoshoot.com/${locale}/blog/${slug}`,
    image: post.featured_image_url ? {
      '@type': 'ImageObject',
      url: post.featured_image_url,
    } : 'https://myaiphotoshoot.com/images/icon_512.png',
    author: { '@id': 'https://myaiphotoshoot.com/#organization' },
    publisher: { '@id': 'https://myaiphotoshoot.com/#organization' },
    datePublished: post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://myaiphotoshoot.com/${locale}/blog/${slug}`,
    },
    keywords: post.photo_topics || 'AI photography, AI photos, AI art',
    articleSection: 'AI Photography',
    inLanguage: locale,
    wordCount: post.content ? post.content.replace(/<[^>]*>/g, '').split(' ').length : 0,
    articleBody: post.content ? post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000) : undefined,
    about: {
      '@type': 'Thing',
      name: 'AI Photography',
      description: 'Artificial intelligence powered photo generation and professional headshots',
    },
    mentions: [
      {
        '@type': 'SoftwareApplication',
        name: 'My AI Photo Shoot',
        url: 'https://myaiphotoshoot.com',
        applicationCategory: 'Photography',
        operatingSystem: 'Web, iOS, Android',
      },
    ],
    isPartOf: {
      '@type': 'Blog',
      name: 'My AI Photo Shoot Blog',
      url: `https://myaiphotoshoot.com/${locale}/blog`,
    },
  } : null;

  const breadcrumbLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `https://myaiphotoshoot.com/${locale}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `https://myaiphotoshoot.com/${locale}/blog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://myaiphotoshoot.com/${locale}/blog/${slug}`
      }
    ]
  } : null;

  // Loading state
  if (isLoading) {
    return (
      <>
        <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Loading blog post...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (isError || !post) {
    return (
      <>
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

        /* Contain generic images inside content */
        .medium-style-article img {
          max-width: 100% !important;
          height: auto !important;
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

        /* Photo Gallery Styles - switch to grid, no horizontal scroll */
        .medium-style-article .photo-gallery {
          margin: 2.5rem 0 !important;
          overflow: visible !important;
          padding: 0 !important;
          width: 100% !important;
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
          display: grid !important;
          /* Ensure minimum 2 columns at all times */
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 1rem !important;
          width: 100% !important;
        }

        .medium-style-article .photo-item {
          text-align: center !important;
          width: 100% !important;
          max-width: 420px !important;
          margin: 0 auto !important;
        }

        .medium-style-article .photo-item img {
          width: 100% !important;
          aspect-ratio: 1 / 1 !important;
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
          max-width: 400px !important;
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
            max-width: 350px !important;
          }
          .medium-style-article .photo-item figcaption {
            max-width: 350px !important;
          }
        }

        /* Increase columns on wider screens while keeping 2 as minimum */
        @media (min-width: 768px) {
          .medium-style-article .photo-row {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
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
            max-width: 300px !important;
          }
          .medium-style-article .photo-item figcaption {
            max-width: 300px !important;
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
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <FAQSchema faqs={faqs} />
      <main className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm overflow-hidden">
            <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-center whitespace-nowrap">
                <Link href={`/${locale}`} className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
              </li>
              <li className="flex items-center whitespace-nowrap">
                <span className="mx-2 text-gray-400 select-none">/</span>
                <Link href={`/${locale}/blog`} className="hover:text-purple-600 dark:hover:text-purple-400">Blog</Link>
              </li>
              <li className="flex items-center min-w-0">
                <span className="mx-2 text-gray-400 select-none">/</span>
                <span aria-current="page" className="text-gray-800 dark:text-gray-200 truncate max-w-[60vw] sm:max-w-[70%] md:max-w-[80%] lg:whitespace-normal lg:overflow-visible lg:max-w-none">{post.title}</span>
              </li>
            </ol>
          </nav>
          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            <header className="p-8 border-b border-gray-200 dark:border-gray-700">
              {/* Article Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Article Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <time dateTime={post.created_at}>
                    {formatDate(post.created_at, locale)}
                  </time>
                </div>
                
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>{calculateReadingTime(post.content)} min read</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>My AI Photo Shoot</span>
                </div>
              </div>

            </header>

            <div className="p-8">
              {/* Table of Contents with Featured Image Background */}
              <div className="relative mb-8">
                {post.featured_image_url && (
                  <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={withDefaultCdnWidth(post.featured_image_url) || post.featured_image_url}
                      alt={post.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover opacity-40"
                      priority
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                )}
                <div className="relative z-10">
                  <TableOfContents 
                    content={post.content}
                    title={t('tableOfContents.title')}
                    className={post.featured_image_url 
                      ? "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 shadow-lg" 
                      : "mb-8"
                    } 
                  />
                </div>
              </div>


              {/* Article Content - Using admin's medium-style-article class */
              }
              <div className="medium-style-article">
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
              </div>

              {/* Section Photos - Commented out since photos are now in content HTML */}
              {/* {post.section_photos && Object.keys(post.section_photos).length > 0 && (
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
                            {Array.isArray(photos) && photos.map((photo: any, index: number) => (
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
                                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
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
                              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSd2rFl9kNMNVvVJFrXqPqJmC9vEhSFrNbPNBOaQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKvNBOqQedcNQ4xUqJFNKv//Z"
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


        </div>
      </main>
    </>
  );
} 