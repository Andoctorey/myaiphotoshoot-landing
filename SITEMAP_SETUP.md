# Automated Sitemap Submission Setup

This guide explains how the automated sitemap submission system works and how to configure it properly.

## 🏗️ Architecture Overview

The system consists of three main components:

1. **Cloudflare Pages Function** (`functions/submit-sitemap.js`)
   - Handles Google Search Console API authentication and submission
   - Uses service account credentials for secure API access
   - Provides both GET (status) and POST (submission) endpoints

2. **Submission Script** (`scripts/submit-sitemap.js`)
   - Calls the Cloudflare Pages Function with retry logic
   - Checks sitemap availability before submission
   - Provides detailed logging and error handling

3. **GitHub Actions Workflow** (`.github/workflows/submit-sitemap.yml`)
   - Automatically triggers after deployment
   - Includes proper delays for deployment completion
   - Provides comprehensive logging and notifications

## 🔧 Configuration Steps

### 1. Google Service Account Setup

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Search Console API**
   - Go to "APIs & Services" > "Library"
   - Search for "Search Console API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in details and create

4. **Generate JSON Key**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the key file

5. **Add to Search Console**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Select your property
   - Go to "Settings" > "Users and permissions"
   - Add your service account email as an "Owner"

### 2. Cloudflare Pages Configuration

1. **Set Environment Variable**
   - Go to your Cloudflare Pages project
   - Navigate to "Settings" > "Environment variables"
   - Add variable: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: Copy the entire JSON content from your service account key file

2. **Deploy the Function**
   - The function is automatically deployed with your site
   - Available at: `https://myaiphotoshoot.com/submit-sitemap`

### 3. GitHub Actions Setup

The workflow is already configured and will:
- Trigger on pushes to `main` or `master` branch
- Wait 130 seconds for deployment completion
- Run the sitemap submission script
- Provide detailed logging

## 🚀 How It Works

### Deployment Flow

1. **Code Push** → GitHub repository
2. **Cloudflare Pages** → Builds and deploys site
3. **GitHub Actions** → Waits 130 seconds
4. **Sitemap Check** → Verifies sitemap is accessible
5. **API Submission** → Calls Google Search Console API
6. **Status Report** → Logs results

### Manual Testing

You can test the system manually:

```bash
# Test the Cloudflare Pages Function
curl -X GET "https://myaiphotoshoot.com/submit-sitemap"

# Test sitemap submission
curl -X POST "https://myaiphotoshoot.com/submit-sitemap" \
  -H "Content-Type: application/json" \
  -d '{"action": "submit-sitemap"}'

# Run the script locally
node scripts/submit-sitemap.js
```

## 🔍 Troubleshooting

### Common Issues

1. **"Service Account key not found"**
   - Check that `GOOGLE_SERVICE_ACCOUNT_KEY` is set in Cloudflare Pages
   - Verify the JSON is valid and complete

2. **"Authentication failed"**
   - Ensure service account has Search Console API access
   - Check that service account is added to Search Console property
   - Verify the private key is correct

3. **"Sitemap not accessible"**
   - Wait longer for deployment to complete
   - Check if sitemap.xml exists in your build output
   - Verify DNS propagation

4. **"API quota exceeded"**
   - Google Search Console has rate limits
   - The system includes retry logic
   - Consider reducing submission frequency

### Debugging Steps

1. **Check GitHub Actions logs**
   - Go to your repository > Actions tab
   - Click on the latest workflow run
   - Review step-by-step logs

2. **Test function directly**
   ```bash
   curl -X GET "https://myaiphotoshoot.com/submit-sitemap"
   ```

3. **Check sitemap availability**
   ```bash
   curl -I "https://myaiphotoshoot.com/sitemap.xml"
   ```

## 📊 Monitoring

### Success Indicators

- ✅ GitHub Actions workflow completes successfully
- ✅ Function returns `success: true`
- ✅ Sitemap appears in Google Search Console
- ✅ New content gets indexed faster

### Log Locations

- **GitHub Actions**: Repository > Actions tab
- **Cloudflare Pages**: Functions tab in dashboard
- **Google Search Console**: Sitemaps section

## 🔒 Security

- Service account credentials are stored as environment variables
- Function only accepts POST requests for submission
- No sensitive data is logged
- CORS headers are properly configured

## 📈 Benefits

- **Faster Indexing**: Google discovers new content immediately
- **Automatic**: No manual intervention required
- **Reliable**: Includes retry logic and error handling
- **Monitored**: Full logging and status reporting
- **Secure**: Uses official Google APIs with proper authentication

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Test the function manually
4. Verify Google Search Console setup
5. Check Cloudflare Pages environment variables

The system is designed to be robust and fail gracefully - even if sitemap submission fails, your site remains fully functional and Google will still discover your content through normal crawling. 