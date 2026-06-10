/**
 * Cloudflare Pages Function for Google Search Console Sitemap Submission
 * 
 * This function submits sitemaps to Google Search Console using the official API
 * URL: https://yourdomain.com/submit-sitemap
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed. Use POST for submission.', {
      status: 405,
      headers: {
        'Allow': 'POST',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain'
      }
    });
  }

  if (!env.SEARCH_SUBMISSION_TOKEN) {
    console.error('SEARCH_SUBMISSION_TOKEN is not configured');
    return jsonResponse({
      success: false,
      message: 'Sitemap submission authentication is not configured'
    }, 500);
  }

  if (!await hasValidBearerToken(request, env.SEARCH_SUBMISSION_TOKEN)) {
    return jsonResponse({
      success: false,
      message: 'Unauthorized'
    }, 401, {
      'WWW-Authenticate': 'Bearer'
    });
  }
  
  try {
    console.log('🚀 Google Search Console API: Sitemap submission started');
    
    // Configuration
    const SITE_URL = 'sc-domain:myaiphotoshoot.com';
    const SITEMAP_URL = 'https://myaiphotoshoot.com/sitemap.xml';
    
    // Check environment variables
    if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return jsonResponse({
        success: false,
        message: 'Google Search Console integration is not configured'
      }, 500);
    }
    
    // Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('✅ Service account credentials parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse service account credentials:', parseError.message);
      return jsonResponse({
        success: false,
        message: 'Google Search Console integration is misconfigured'
      }, 500);
    }
    
    // Get OAuth2 access token
    console.log('🔑 Getting OAuth2 access token...');
    const tokenResult = await getGoogleAccessToken(credentials);
    
    if (!tokenResult.success) {
      console.error('❌ Failed to get access token:', tokenResult.error);
      return jsonResponse({
        success: false,
        message: 'Failed to authenticate with Google API'
      }, 502);
    }
    
    console.log('✅ Successfully authenticated with Google API');
    
    // Submit sitemap to Google Search Console
    console.log('📤 Submitting sitemap to Google Search Console...');
    const submitResult = await submitSitemap(tokenResult.accessToken, SITE_URL, SITEMAP_URL);
    
    if (submitResult.success) {
      console.log('🎉 Sitemap submitted successfully!');
      
      // Try to get sitemap status
      const statusResult = await getSitemapStatus(tokenResult.accessToken, SITE_URL, SITEMAP_URL);
      
      return jsonResponse({
        success: true,
        message: 'Sitemap submitted successfully to Google Search Console',
        data: {
          siteUrl: SITE_URL,
          sitemapUrl: SITEMAP_URL,
          submissionTime: new Date().toISOString(),
          status: statusResult.success ? statusResult.data : 'Status check failed'
        }
      });
    } else {
      console.error('❌ Failed to submit sitemap:', submitResult.error);
      return jsonResponse({
        success: false,
        message: 'Failed to submit sitemap'
      }, 502);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return jsonResponse({
      success: false,
      message: 'Unexpected error occurred',
      timestamp: new Date().toISOString()
    }, 500);
  }
}

async function hasValidBearerToken(request, expectedToken) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authorization.slice('Bearer '.length);
  if (!providedToken) {
    return false;
  }

  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(providedToken)),
    crypto.subtle.digest('SHA-256', encoder.encode(expectedToken))
  ]);
  const providedBytes = new Uint8Array(providedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let difference = 0;

  for (let i = 0; i < providedBytes.length; i++) {
    difference |= providedBytes[i] ^ expectedBytes[i];
  }

  return difference === 0;
}

function jsonResponse(payload, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...additionalHeaders
    }
  });
}

/**
 * Get Google OAuth2 access token using service account credentials
 */
async function getGoogleAccessToken(credentials) {
  try {
    // Create JWT assertion using Web Crypto API
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now
    };
    
    // Create JWT
    const jwt = await createJWT(header, payload, credentials.private_key);
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return { success: false, error: `Token request failed (${tokenResponse.status}): ${errorText}` };
    }
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return { success: false, error: 'No access token received' };
    }
    
    return { success: true, accessToken: tokenData.access_token };
    
  } catch (error) {
    return { success: false, error: `Token generation failed: ${error.message}` };
  }
}

/**
 * Create JWT using Web Crypto API (compatible with Cloudflare Workers/Pages)
 */
async function createJWT(header, payload, privateKey) {
  // Base64url encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // Create the message to sign
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key for signing
  const keyData = await importPrivateKey(privateKey);
  
  // Sign the message
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyData,
    new TextEncoder().encode(message)
  );
  
  // Base64url encode the signature
  const encodedSignature = base64urlEncode(signature);
  
  return `${message}.${encodedSignature}`;
}

/**
 * Import RSA private key for signing
 */
async function importPrivateKey(privateKeyPem) {
  // Remove PEM headers and whitespace
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  // Convert base64 to ArrayBuffer
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  // Import the key
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
}

/**
 * Base64url encode (URL-safe base64 without padding)
 */
function base64urlEncode(data) {
  let base64;
  
  if (data instanceof ArrayBuffer) {
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  } else {
    // Convert string to base64
    base64 = btoa(data);
  }
  
  // Make it URL-safe and remove padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Submit sitemap to Google Search Console
 */
async function submitSitemap(accessToken, siteUrl, sitemapUrl) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get sitemap status from Google Search Console
 */
async function getSitemapStatus(accessToken, siteUrl, sitemapUrl) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
