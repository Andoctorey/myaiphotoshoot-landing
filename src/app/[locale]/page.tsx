import { locales } from '@/i18n/request';
import LocalizedHomeClient from './LocalizedHomeClient';

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default function LocalizedHome() {
  return <LocalizedHomeClient />;
} 