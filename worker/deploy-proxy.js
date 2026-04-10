// Cloudflare Worker Proxy for Landing Page Deployment
// This worker acts as a CORS-enabled proxy between the admin interface and Cloudflare Pages webhook

const DEFAULT_GITHUB_OWNER = 'Andoctorey';
const DEFAULT_GITHUB_REPO = 'myaiphotoshoot-landing';
const DEFAULT_WORKFLOW_ID = 'submit-sitemap.yml';
const DEFAULT_WORKFLOW_REF = 'main';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
      });
    }

    try {
      // Get the deployment webhook URL from environment
      const deployWebhookUrl = env.DEPLOY_WEBHOOK_URL;
      
      if (!deployWebhookUrl) {
        console.error('DEPLOY_WEBHOOK_URL not configured');
        return new Response('Deployment webhook not configured', {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/plain',
          },
        });
      }

      // Parse the request body to get deployment reason
      let deploymentReason = 'Manual deployment from admin';
      try {
        const requestBody = await request.json();
        deploymentReason = requestBody.reason || deploymentReason;
      } catch (e) {
        // If JSON parsing fails, use default reason
        console.warn('Failed to parse request body, using default reason');
      }

      console.log(`Triggering deployment: ${deploymentReason}`);

      // Forward the request to Cloudflare Pages webhook
      const webhookResponse = await fetch(deployWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deploymentReason,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook request failed:', webhookResponse.status, errorText);
        
        return new Response(`Deployment failed: ${webhookResponse.status} ${webhookResponse.statusText}`, {
          status: webhookResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/plain',
          },
        });
      }

      const searchUpdates = await triggerSearchUpdatesWorkflow(env);
      if (searchUpdates.enabled && !searchUpdates.triggered) {
        console.warn('Search update workflow dispatch failed:', searchUpdates.message);
      }

      // Success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Deployment triggered successfully',
        reason: deploymentReason,
        searchUpdates,
        timestamp: new Date().toISOString(),
      }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

async function triggerSearchUpdatesWorkflow(env) {
  const token = env.GITHUB_ACTIONS_TRIGGER_TOKEN;
  if (!token) {
    return {
      enabled: false,
      triggered: false,
      message: 'GitHub workflow trigger is not configured (missing GITHUB_ACTIONS_TRIGGER_TOKEN)'
    };
  }

  const owner = env.GITHUB_OWNER || DEFAULT_GITHUB_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_GITHUB_REPO;
  const workflowId = env.SEARCH_UPDATES_WORKFLOW_ID || DEFAULT_WORKFLOW_ID;
  const ref = env.SEARCH_UPDATES_REF || DEFAULT_WORKFLOW_REF;

  const endpoint =
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'myaiphotoshoot-deploy-proxy',
      },
      body: JSON.stringify({ ref }),
    });

    if (response.status === 204) {
      return {
        enabled: true,
        triggered: true,
        message: `Triggered ${owner}/${repo}:${workflowId} on ${ref}`
      };
    }

    const errorText = await response.text();
    return {
      enabled: true,
      triggered: false,
      status: response.status,
      message: `GitHub workflow dispatch failed with HTTP ${response.status}`,
      error: errorText.slice(0, 500)
    };
  } catch (error) {
    return {
      enabled: true,
      triggered: false,
      message: `GitHub workflow dispatch request failed: ${error.message}`
    };
  }
}
