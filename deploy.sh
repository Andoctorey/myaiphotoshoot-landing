#!/bin/bash

# Exit if any command fails
set -e

echo "🚀 Preparing to deploy myaiphotoshoot-landing..."

# Build with ESLint checks enabled
echo "🔍 Building with ESLint checks..."
npm run build

# Add output: 'export' to next.config.ts temporarily for static export
echo "📝 Modifying Next.js config for static export..."
sed -i '' "s/const nextConfig: NextConfig = {/const nextConfig: NextConfig = {\n  output: 'export',/" next.config.ts

# Export the Next.js app to static files
echo "📦 Creating static export..."
npx next build

# Check if the out directory was created
if [ ! -d "out" ]; then
  echo "❌ Build failed to create 'out' directory. Aborting."
  # Restore next.config.ts
  sed -i '' "s/  output: 'export',//" next.config.ts
  exit 1
fi

# Deploy to Cloudflare Pages
echo "🌩️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy out --project-name=myaiphotoshoot-landing --commit-dirty=true

# Restore next.config.ts
echo "📝 Restoring Next.js config..."
sed -i '' "s/  output: 'export',//" next.config.ts

echo "✅ Deployment complete! Your site will be available at myaiphotoshoot-landing.pages.dev" 