#!/bin/bash

# Exit if any command fails
set -e

echo "🚀 Deploying myaiphotoshoot-landing-deploy-proxy worker..."

# Navigate to worker directory
cd "$(dirname "$0")"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Deploy the worker
echo "🌩️ Deploying worker to Cloudflare..."
wrangler deploy

echo "✅ Worker deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set up the deployment webhook URL:"
echo "   wrangler secret put DEPLOY_WEBHOOK_URL"
echo ""
echo "2. The worker will be available at:"
echo "   https://myaiphotoshoot-landing-deploy-proxy.myaiphotoshoot.workers.dev"
echo ""
echo "3. Configure your admin interface to use this worker URL" 