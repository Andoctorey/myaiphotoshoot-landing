import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/request';

// Add ISR revalidation
export const revalidate = 3600; // 1 hour

export default function Home() {
  // Redirect to the default locale
  redirect(`/${defaultLocale}`);
}
