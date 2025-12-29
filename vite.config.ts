import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/clue-sheet/",
  plugins: [
    react(),
    VitePWA({
      /**
       * Auto-update uses workbox-window’s update flow. Good default for a simple
       * friend-only app where you want people to receive updates without prompts.
       */
      registerType: "autoUpdate",
      // For GH Pages subpath hosting:
      scope: "/clue-sheet/",

      /**
       * includeAssets is for extra static assets in /public (favicons, fonts, etc.).
       * Manifest icons do NOT need to be listed here if they live under /public.
       */
      // includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],

      manifest: {
        name: "Clue Sheet",
        short_name: "Clue Sheet",
        description: "Advanced Clue/Cluedo deduction sheet",
        theme_color: "#111827",
        background_color: "#111827",
        display: "standalone",
        start_url: "/clue-sheet/",
        scope: "/clue-sheet/",
        icons: [
          {
            src: "/clue-sheet/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/clue-sheet/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/clue-sheet/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      /**
       * Enable service worker logic during development.
       * The plugin docs describe devOptions.enabled for this purpose.
       */
      devOptions: {
        enabled: true,
      },

      /**
       * For SPAs, this helps offline navigation return index.html.
       * Keep it simple for now; we can refine when we implement offline behavior.
       */
      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
});
