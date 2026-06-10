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

# Check required configuration before deployment.
echo "Required Worker secrets:"
echo "   npx wrangler secret put DEPLOY_WEBHOOK_URL"
echo "   npx wrangler secret put TEAM_DOMAIN"
echo "   npx wrangler secret put POLICY_AUD"
echo "   npx wrangler secret put DEPLOY_ALLOWED_EMAILS      # comma-separated"
echo ""
echo "Optional GitHub workflow secrets:"
echo "   npx wrangler secret put GITHUB_ACTIONS_TRIGGER_TOKEN"
echo "   npx wrangler secret put GITHUB_OWNER                # default: Andoctorey"
echo "   npx wrangler secret put GITHUB_REPO                 # default: myaiphotoshoot-landing"
echo "   npx wrangler secret put SEARCH_UPDATES_WORKFLOW_ID  # default: submit-sitemap.yml"
echo "   npx wrangler secret put SEARCH_UPDATES_REF          # default: main"
echo ""
echo "Set the secrets above before continuing."
read -r -p "Deploy the Worker to admin.myaiphotoshoot.com/api/deploy now? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo "🌩️ Deploying worker to Cloudflare..."
npx wrangler deploy

echo "✅ Worker deployed successfully!"
echo "Endpoint: https://admin.myaiphotoshoot.com/api/deploy"
