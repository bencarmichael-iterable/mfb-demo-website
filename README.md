# MyFoodBag Demo Website

A demo website showcasing Iterable marketing automation capabilities including user tracking, custom events, and profile management.

## Live Site

**Production URL:** https://mfb-iterable-demo.netlify.app

## Iterable SDK Status

The Iterable Web SDK is **ENABLED** and configured to track:
- User sign-ins and profile updates
- Custom events (checkout, subscriptions, etc.)
- Subscription preferences

The SDK is configured in `iterable-config.js` with `SDK_ENABLED = true`.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation

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

## Development

### Available Scripts

- `npm run dev` - Start development server
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
- `personalisation.html` - Personalisation features
- `automation.html` - Automation features
- `analytics.html` - Analytics features

**JavaScript:**
- `script.js` - Main JavaScript and interactivity
- `iterable-config.js` - Iterable Web SDK configuration
- `checkout.js` - Checkout page logic
- `subscription-success.js` - Subscription success page logic
- `custom-event.js` - Custom event page logic
- `update-profile.js` - Profile update page logic

**Config & Styles:**
- `styles.css` - Stylesheet with modular CSS variables
- `vite.config.js` - Vite build configuration
- `netlify.toml` - Netlify deployment config
- `.env.local` - Environment variables (not in git)

## Deployment

This site is configured to deploy automatically to Netlify when changes are pushed to the main branch.

### Netlify Configuration

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** Set `VITE_ITERABLE_API_KEY` in Netlify Dashboard → Site Settings → Environment Variables

### Production URL

The site is deployed at: https://mfb-iterable-demo.netlify.app

## Iterable Integration

The project uses the Iterable Web SDK (`@iterable/web-sdk`) for marketing automation. Features include:

- **User Tracking:** Automatically tracks user sign-ins and sets user identity
- **Profile Updates:** Updates user profiles with checkout and preference data
- **Custom Events:** Tracks custom events like purchases and subscriptions
- **Subscription Management:** Manages email/channel subscription preferences

For more details, see:
- `SETUP.md` - Complete setup, configuration, and deployment guide
- `iterable-config.js` - SDK configuration and available functions

## Security Notes

- ✅ API key is stored in `.env.local` (not committed to git)
- ✅ API key is stored in Netlify environment variables (for production)
- ⚠️ API key will be visible in browser JavaScript (expected for Iterable Web SDK public keys)
- ✅ API key has limited permissions (only what Web SDK allows)

## Contributing

1. Clone the repository
2. Create your `.env.local` file with the API key
3. Make your changes
4. Test locally with `npm run dev`
5. Commit and push to GitHub
6. Netlify will automatically deploy

## Support

For questions or issues, contact the team lead or refer to the setup guides in the repository.
