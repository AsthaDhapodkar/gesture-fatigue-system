import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // ── CORS headers so MediaPipe WASM files load correctly in dev ──
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // ── MediaPipe EXCLUDED from manual chunks ──────────────────
          // MediaPipe is loaded via CDN <script> tags in index.html.
          // Bundling it causes WASM path resolution failures because
          // MediaPipe internally uses self.location to find .wasm files,
          // which breaks when the JS is bundled into a different path.
          // Leave it to the CDN — GestureEngine does dynamic imports
          // that fall back to the CDN globals (window.Hands etc.).

          // App chunks — everything else splits normally
          'vendor':   ['react', 'react-dom'],
          'charts':   ['recharts'],
        },
      },
    },
  },

  optimizeDeps: {
    // ── EXCLUDE MediaPipe from Vite's dep pre-bundling ─────────────
    // MediaPipe ships pre-built UMD bundles + WASM files that Vite's
    // esbuild pre-bundler cannot handle correctly. Excluding them tells
    // Vite to leave those imports alone — GestureEngine's dynamic
    // `import('@mediapipe/hands')` will resolve to the CDN globals
    // that index.html already loaded.
    exclude: [
      '@mediapipe/hands',
      '@mediapipe/camera_utils',
      '@mediapipe/drawing_utils',
    ],
  },

  // ── Treat MediaPipe as external globals ─────────────────────────────
  // Tells Rollup that these package names are already available as
  // globals on `window` (put there by the CDN scripts in index.html).
  // This prevents "Could not resolve @mediapipe/hands" build errors.
  resolve: {
    alias: {},
  },
});