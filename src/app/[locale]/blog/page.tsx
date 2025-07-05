import BlogPageClient from './BlogPageClient';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  return <BlogPageClient locale={locale} />;
} 