/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://myaiphotoshoot.com',
  generateRobotsTxt: true,
  // Generate sitemap for each locale
  i18n: {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
  },
  // Additional configuration
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
} 