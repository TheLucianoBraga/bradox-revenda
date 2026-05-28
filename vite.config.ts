// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        strategies: "generateSW",
        includeAssets: ["favicon.ico", "bradox-play-logo.png", "pwa-512.png", "apple-touch-icon.png"],
        manifest: {
          name: "Bradox Play",
          short_name: "Bradox Play",
          description: "Gestão de redes, revendas, servidores e cobranças Tv Online.",
          theme_color: "#0f1115",
          background_color: "#0f1115",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/dashboard",
          icons: [
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          navigateFallback: "/dashboard",
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/rest/v1/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "bradox-api-cache",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 10 },
              },
            },
          ],
        },
      }),
    ],
    preview: {
      allowedHosts: process.env.APP_DOMAIN ? [process.env.APP_DOMAIN] : [],
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
