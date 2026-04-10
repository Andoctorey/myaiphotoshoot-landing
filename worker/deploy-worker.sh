#!/bin/bash

# Exit if any command fails
set -e

echo "🚀 Deploying myaiphotoshoot-landing-deploy-proxy worker..."

# Navigate to worker directory
cd "$(dirname "$0")"

# Check if local wrangler is installed
if ! npx --no-install wrangler --version &> /dev/null; then
    echo "❌ Local Wrangler CLI is not installed. Install project dependencies first:"
    echo "npm install"
    exit 1
fi

# Deploy the worker
echo "🌩️ Deploying worker to Cloudflare..."
npx wrangler deploy

echo "✅ Worker deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set up the deployment webhook URL:"
echo "   npx wrangler secret put DEPLOY_WEBHOOK_URL"
echo ""
echo "2. (Optional) Enable GitHub workflow trigger for search updates:"
echo "   npx wrangler secret put GITHUB_ACTIONS_TRIGGER_TOKEN"
echo "   npx wrangler secret put GITHUB_OWNER                # default: Andoctorey"
echo "   npx wrangler secret put GITHUB_REPO                 # default: myaiphotoshoot-landing"
echo "   npx wrangler secret put SEARCH_UPDATES_WORKFLOW_ID  # default: submit-sitemap.yml"
echo "   npx wrangler secret put SEARCH_UPDATES_REF          # default: main"
echo ""
echo "3. The worker will be available at:"
echo "   https://myaiphotoshoot-landing-deploy-proxy.myaiphotoshoot.workers.dev"
echo ""
echo "4. Configure your admin interface to use this worker URL" 
