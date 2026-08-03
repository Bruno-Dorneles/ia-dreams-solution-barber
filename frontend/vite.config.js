import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const barberProBase = '/apps/barberpro';

function barberProBaseRedirect() {
  function redirectBasePath(req, res, next) {
    const url = req.url || '';
    const suffix = url.slice(barberProBase.length);

    if (url === barberProBase || suffix.startsWith('?')) {
      req.url = `${barberProBase}/${suffix}`;
    }

    next();
  }

  return {
    name: 'barberpro-base-redirect',
    configureServer(server) {
      server.middlewares.use(redirectBasePath);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirectBasePath);
    },
  };
}

export default defineConfig({
  base: process.env.VITE_APP_BASE || `${barberProBase}/`,
  plugins: [barberProBaseRedirect(), react()],
  preview: {
    allowedHosts: true,
  },
});
