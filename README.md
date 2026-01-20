# MyFoodBag Demo Website

A landing page for demonstrations showcasing Iterable marketing automation capabilities.

## ⚠️ Current Status

**The Iterable Web SDK is currently DISABLED** until the website is re-skinned for the client.

To re-enable the SDK:
1. Open `iterable-config.js`
2. Set `SDK_ENABLED = true`
3. Uncomment the SDK imports at the top of the file
4. Add your API key to `.env.local` as `VITE_ITERABLE_API_KEY=your_key_here`
5. Run `npm install` to ensure dependencies are installed

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

3. **Set up environment variables (when SDK is re-enabled)**
   
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

- `index.html` - Main HTML file
- `styles.css` - Stylesheet with modular CSS variables
- `script.js` - Main JavaScript and interactivity
- `iterable-config.js` - Iterable Web SDK configuration
- `.env.local` - Environment variables (not in git)

## Deployment

This site is configured to deploy automatically to Netlify when changes are pushed to the main branch.

### Netlify Configuration

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** Set `VITE_ITERABLE_API_KEY` in Netlify Dashboard → Site Settings → Environment Variables

### Production URL

The site is deployed at: `iterabledemoanz.netlify.app`

## Iterable Integration

The project uses the Iterable Web SDK for marketing automation. The SDK is configured but will not send data until explicitly approved.

For more details, see:
- `SETUP.md` - Complete setup, configuration, and deployment guide

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
