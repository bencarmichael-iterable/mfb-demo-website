# Setup Guide

Complete setup and configuration guide for the MyFoodBag Demo Website.

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
   git clone https://github.com/bencarmichael-iterable/mfb-demo-website.git
   cd mfb-demo-website
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
✅ Installed and **ENABLED**

The Iterable Web SDK is fully configured and active. It tracks:
- User sign-ins and profile updates
- Custom events (checkout, subscriptions, etc.)
- Subscription preferences

### Current Setup

- ✅ `@iterable/web-sdk` package installed
- ✅ Configuration file created (`iterable-config.js`)
- ✅ Build system configured (Vite)
- ✅ SDK enabled (`SDK_ENABLED = true` in `iterable-config.js`)

### Files

- `iterable-config.js` - SDK configuration and exported functions
- `script.js` - Main application logic (imports Iterable config)
- `checkout.js` - Checkout flow with Iterable tracking
- `subscription-success.js` - Post-checkout tracking
- `custom-event.js` - Custom event demo page
- `update-profile.js` - Profile update demo page
- `vite.config.js` - Build configuration

### Available Functions

The SDK exports these functions from `iterable-config.js`:

```javascript
import { 
  initializeIterable,    // Initialize SDK with user email
  trackEvent,            // Track custom events
  updateUser,            // Update user profile
  updateSubscription,    // Update subscription preferences
  resetIterable,         // Logout/reset SDK
  isIterableInitialized  // Check if SDK is ready
} from './iterable-config.js';
```

### Important Notes

- SDK initializes when user signs in (email required)
- All Iterable SDK calls are wrapped in safety checks
- Logout properly resets the SDK state

## Development

### Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure

**HTML Pages:**
- `index.html` - Main landing page with plan selection
- `checkout.html` - Checkout flow for subscriptions
- `subscription-success.html` - Post-checkout confirmation
- `how-it-works.html` - How the service works
- `custom-event.html` - Custom event tracking demo
- `update-profile.html` - Profile update demo
- `data-capture.html` - Data capture demo
- `personalisation.html`, `automation.html`, `analytics.html` - Feature pages

**JavaScript:**
- `script.js` - Main JavaScript and interactivity
- `iterable-config.js` - Iterable Web SDK configuration
- `checkout.js`, `subscription-success.js`, `custom-event.js`, `update-profile.js` - Page-specific logic

**Config:**
- `styles.css` - Stylesheet with modular CSS variables
- `vite.config.js` - Build configuration
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

The site is deployed at: https://mfb-iterable-demo.netlify.app

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
