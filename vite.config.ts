import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Force cache clear by changing config
const cacheVersion = Date.now();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: `.vite-${cacheVersion}`,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    force: true,
    include: [
      'react', 
      'react-dom',
      'react/jsx-runtime',
      'next-themes',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      'sonner',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
