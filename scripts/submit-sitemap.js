#!/usr/bin/env node

/**
 * Auto-submit sitemap to Google Search Console
 * 
 * This script calls a Cloudflare Pages Function that has access to environment variables
 * The function handles the actual Google Search Console API submission
 */

// Enhanced sitemap availability check with retries
async function checkSitemapExists(maxRetries = 5, delayMs = 3000) {
  const SITEMAP_URL = 'https://myaiphotoshoot.com/sitemap.xml';
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fetch = (await import('node-fetch')).default;
      console.log(`🔍 Checking sitemap availability (attempt ${i + 1}/${maxRetries})...`);
      
      const response = await fetch(SITEMAP_URL, { 
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'MyAIPhotoShoot-SitemapBot/1.0'
        }
      });
      
      if (response.ok) {
        console.log('✅ Sitemap is accessible!');
        return true;
      }
      
      console.log(`⚠️ Sitemap not ready (${response.status}), retrying in ${delayMs/1000}s...`);
    } catch (error) {
      console.log(`⚠️ Sitemap check failed: ${error.message}, retrying in ${delayMs/1000}s...`);
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log('❌ Sitemap not accessible after all retries');
  return false;
}

async function submitSitemapViaFunction() {
  console.log('🔑 Submitting sitemap via Cloudflare Pages Function...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Call the Cloudflare Pages Function
    const response = await fetch('https://myaiphotoshoot.com/submit-sitemap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MyAIPhotoShoot-Deploy/1.0'
      },
      body: JSON.stringify({
        action: 'submit-sitemap',
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('🎉 Sitemap submitted successfully via Cloudflare Pages Function!');
      console.log(`📍 Sitemap URL: ${result.sitemapUrl}`);
      return true;
    } else {
      console.log('⚠️ Function call failed:', result.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error calling Cloudflare Pages Function:', error.message);
    return false;
  }
}

// Main execution with comprehensive retry logic
async function main() {
  console.log('🚀 Auto-sitemap submission started...');
  console.log('ℹ️ Using Cloudflare Pages Function for submission');
  
  // Wait for deployment to settle
  console.log('⏳ Waiting 10 seconds for deployment to settle...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check if sitemap is accessible before attempting submission
  console.log('🔍 Verifying sitemap accessibility...');
  const sitemapAccessible = await checkSitemapExists();
  
  if (!sitemapAccessible) {
    console.log('⚠️ Sitemap not accessible. This might be due to:');
    console.log('   - DNS propagation delay');
    console.log('   - CDN cache clearing');
    console.log('   - Deployment still in progress');
    console.log('✅ Google will discover the sitemap through robots.txt automatically');
    console.log('💡 Your robots.txt already includes: Sitemap: https://myaiphotoshoot.com/sitemap.xml');
    return;
  }
  
  // Try function method
  const success = await submitSitemapViaFunction();
  
  if (success) {
    console.log('🎯 Sitemap submission completed successfully!');
    console.log('📈 Your new content should be indexed faster by Google');
    console.log('🔄 Future deployments will automatically notify Google of updates');
  } else {
    console.log('ℹ️ Function submission not available, but your sitemap is still discoverable!');
    console.log('🔗 Sitemap URL: https://myaiphotoshoot.com/sitemap.xml');
    console.log('✅ Google will discover your content through:');
    console.log('   - robots.txt reference (already configured)');
    console.log('   - Regular crawling patterns');
    console.log('   - Manual submission in Search Console (one-time setup)');
    console.log('');
    console.log('🚀 For fully automated submissions, the Cloudflare Pages Function needs:');
    console.log('   1. Environment variables properly configured');
    console.log('   2. Google Search Console API access');
    console.log('   See SITEMAP_SETUP.md for step-by-step instructions');
  }
  
  console.log('✨ Process completed!');
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Sitemap submission process failed:', error);
    console.log('ℹ️ This does not affect your deployment - your site is still live!');
    console.log('ℹ️ Google will still discover your sitemap through robots.txt');
    // Don't exit with error code to avoid failing deployment
    process.exit(0);
  });
}

module.exports = { submitSitemapViaFunction }; 