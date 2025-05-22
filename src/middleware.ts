import { locales } from '@/i18n/request';

// Define static pages that should be pre-rendered for each locale
export const staticPages = [
  '/',
  '/support',
];

// This middleware isn't actually used at runtime with static exports,
// but it helps Next.js understand all the static paths that need to be generated
export function middleware() {
  return;
}

// Generate static paths for all locales and pages
export function generateStaticParams() {
  return locales.flatMap(locale => 
    staticPages.map(page => ({
      locale,
      path: page === '/' ? [] : [page.slice(1)],
    }))
  );
}

// Configure the middleware to only run for specific paths
export const config = {
  matcher: [
    // Match all paths except for:
    // - API routes
    // - /_next (internal Next.js paths)
    // - /images, /fonts, etc. (static files)
    '/((?!api|_next|images|fonts|favicon).*)',
  ],
}; 