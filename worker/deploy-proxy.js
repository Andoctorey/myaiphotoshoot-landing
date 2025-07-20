// Cloudflare Worker Proxy for Landing Page Deployment
// This worker acts as a CORS-enabled proxy between the admin interface and Cloudflare Pages webhook

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

      // Success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Deployment triggered successfully',
        reason: deploymentReason,
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