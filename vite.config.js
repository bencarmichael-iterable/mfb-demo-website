import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        'data-capture': './data-capture.html',
        'personalisation': './personalisation.html',
        'automation': './automation.html',
        'analytics': './analytics.html',
        'custom-event': './custom-event.html',
        'update-profile': './update-profile.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: false // We don't need a public directory for this setup
});
