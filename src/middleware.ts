import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,
  
  // The default locale to use when visiting a non-localized route
  defaultLocale,
  
  // Automatically redirect to the preferred locale (if detected)
  localeDetection: true,
  
  // Redirect paths that are not in the locale prefix
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /images, /fonts, /favicon.ico, etc.
  matcher: ['/((?!api|_next|images|fonts|favicon.ico).*)']
}; 