import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './request';
import { defineRouting } from 'next-intl/routing';

// Define routing configuration for static export
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // English lives at root for static export
});

// Export navigation APIs that work with static export
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing); 