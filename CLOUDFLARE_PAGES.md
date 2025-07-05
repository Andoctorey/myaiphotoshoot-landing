# Cloudflare Pages Deployment

This project is deployed on **Cloudflare Pages** with native Next.js support.

## Configuration

### Build Settings
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Node.js version**: 18+

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`: Your Supabase Functions URL

## Benefits

✅ **Edge Runtime**: Runs on Cloudflare Workers for ultra-fast performance  
✅ **Dynamic routing**: Blog posts load dynamically without pre-generation  
✅ **SSR support**: Perfect SEO with server-side rendering  
✅ **Global CDN**: Automatic caching and optimization  
✅ **No build-time limitations**: Content updates instantly  

## SEO Features

- **Dynamic metadata**: Each blog post generates unique meta tags
- **Auto-updating sitemap**: `/sitemap.xml` includes all content automatically
- **Robots.txt**: Generated dynamically at `/robots.txt`
- **JSON-LD structured data**: Rich snippets for search engines
- **OpenGraph + Twitter Cards**: Perfect social media sharing

## Performance

- **Edge caching**: Content cached globally on Cloudflare's network
- **Instant updates**: No rebuild required for new content
- **Core Web Vitals**: Optimized for Google's performance metrics
- **Image optimization**: Next.js Image component works perfectly

## Deployment

1. Connect your GitHub repository to Cloudflare Pages
2. Set the build settings above
3. Add environment variables
4. Deploy!

No additional configuration needed - Cloudflare Pages handles everything automatically. 