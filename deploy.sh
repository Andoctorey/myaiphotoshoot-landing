#!/bin/bash

# Exit if any command fails
set -e

echo "🚀 Preparing to deploy myaiphotoshoot-landing..."

# IMPORTANT: This project is deployed as a static site on Cloudflare Pages
# All routes must be compatible with static export (see next.config.ts)

# Clean previous build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next out

# Build the Next.js app for static export
echo "🔨 Building for static export..."
npm run build

# Check if the out directory was created
if [ ! -d "out" ]; then
  echo "❌ Build failed to create 'out' directory. Aborting."
  exit 1
fi

# Deploy to Cloudflare Pages
echo "🌩️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy out --project-name=myaiphotoshoot-landing --commit-dirty=true

echo "✅ Deployment complete! Your site will be available at myaiphotoshoot-landing.pages.dev" 