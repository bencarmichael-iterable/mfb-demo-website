# Setup Guide

Complete setup and configuration guide for the ANZ Demo Website.

## Table of Contents
- [Initial Setup](#initial-setup)
- [API Key Storage](#api-key-storage)
- [Iterable Web SDK](#iterable-web-sdk)
- [Development](#development)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

## Initial Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/bencarmichael-iterable/ANZ-Demo-Website.git
   cd ANZ-Demo-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```bash
   VITE_ITERABLE_API_KEY=your_api_key_here
   ```
   
   **Note:** Get the API key from the team lead or Iterable dashboard. The `.env.local` file is already in `.gitignore` and will not be committed to git.

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   The site will be available at `http://localhost:3000`

## API Key Storage

### Important Note
The Iterable Web SDK uses a **public API key** (not a secret key). It's designed to be used in client-side JavaScript, so it will be visible in the browser. This is expected and secure for the Web SDK.

### Storage Options

**For Local Development:**
- Store in `.env.local` file (already in `.gitignore`)
- Format: `VITE_ITERABLE_API_KEY=your_api_key_here`
- Each developer creates their own `.env.local` file locally

**For Production (Netlify):**
- Set `VITE_ITERABLE_API_KEY` in Netlify Dashboard → Site Settings → Environment Variables
- Netlify will inject it during build
- Can be different per environment (production, staging)

### Security Notes

- ✅ API key is stored in `.env.local` (not committed to git)
- ✅ API key is stored in Netlify environment variables (for production)
- ⚠️ API key will be visible in browser JavaScript (expected for Iterable Web SDK public keys)
- ✅ API key has limited permissions (only what Web SDK allows)
- ✅ Different from server-side secret API keys

### Getting the API Key

If you need the API key:
1. Ask the team lead
2. Or access Iterable dashboard → Settings → API Keys → Web API Key

## Iterable Web SDK

### Status
✅ Installed, ⏸️ Not Initialized

The Iterable Web SDK has been installed and configured, but **it will NOT send any data** until:
1. API key is provided
2. You approve initialization
3. `approveIterableInitialization()` is called

### Current Setup

- ✅ `@iterable/web-sdk` package installed
- ✅ Configuration file created (`iterable-config.js`)
- ✅ Build system configured (Vite)
- ⏸️ SDK NOT initialized (waiting for approval)

### Files

- `iterable-config.js` - SDK configuration and initialization functions
- `script.js` - Main application logic (imports Iterable config)
- `vite.config.js` - Build configuration

### To Initialize (After API Key is Provided)

Once you provide the API key and approve, you can initialize the SDK by calling:

```javascript
import { approveIterableInitialization } from './iterable-config.js';

// Approve and initialize with your API key
approveIterableInitialization();
```

### Important Notes

- **No data will be sent to Iterable until explicitly initialized**
- All Iterable SDK calls are wrapped in safety checks
- The SDK instance is only created after `approveIterableInitialization()` is called
- Logout properly resets the SDK state

## Development

### Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure

- `index.html` - Main landing page
- `data-capture.html`, `personalisation.html`, `automation.html`, `analytics.html` - Feature pages
- `styles.css` - Stylesheet with modular CSS variables
- `script.js` - Main JavaScript and interactivity
- `iterable-config.js` - Iterable Web SDK configuration
- `.env.local` - Environment variables (not in git)

### Troubleshooting

**"API key not found" error:**
- Check that `.env.local` exists and contains `VITE_ITERABLE_API_KEY`
- Restart the dev server after creating `.env.local`
- For production, verify Netlify environment variable is set

**Build issues:**
- Ensure Node.js version is 18 or higher
- Delete `node_modules` and run `npm install` again
- Check Netlify build logs for errors

## Deployment

### Netlify Configuration

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** Set `VITE_ITERABLE_API_KEY` in Netlify Dashboard → Site Settings → Environment Variables

### Production URL

The site is deployed at: `iterabledemoanz.netlify.app`

### Automatic Deployment

This site is configured to deploy automatically to Netlify when changes are pushed to the main branch.

## Security Notes

- ✅ API key is stored in `.env.local` (not committed to git)
- ✅ API key is stored in Netlify environment variables (for production)
- ⚠️ API key will be visible in browser JavaScript (expected for Iterable Web SDK public keys)
- ✅ API key has limited permissions (only what Web SDK allows)
- ✅ Different from server-side secret API keys

## Contributing

1. Clone the repository
2. Create your `.env.local` file with the API key
3. Make your changes
4. Test locally with `npm run dev`
5. Commit and push to GitHub
6. Netlify will automatically deploy

## Support

For questions or issues, contact the team lead or refer to this setup guide.
