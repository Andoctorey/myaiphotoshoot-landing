import BlogPostPageClient from './BlogPostPageClient';
import { locales } from '@/i18n/request';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate static params for all locales
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  
  // For static export, we need to generate params for all possible blog posts
  // Since we don't know all blog posts at build time, we'll generate empty params
  // and let the page handle 404s dynamically
  for (const locale of locales) {
    // Add a placeholder param that will be handled by the page
    params.push({ locale, slug: 'placeholder' });
  }
  
  return params;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;

  return <BlogPostPageClient slug={slug} locale={locale} />;
} 