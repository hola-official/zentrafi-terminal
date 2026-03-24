/**
 * CDN / IIFE build — produces dist/cdn/main.js + dist/cdn/style.css
 * Upload those two files to the CDN and ship to script-tag consumers.
 *
 * Usage after build:
 *   <link rel="stylesheet" href="https://cdn.zentrafi.xyz/terminal/style.css">
 *   <script src="https://cdn.zentrafi.xyz/terminal/main.js"></script>
 *   <script>
 *     window.ZentraX.init({ containerId: "swap", displayMode: "Integrated" })
 *   </script>
 */
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: { "@terminal": path.resolve(__dirname, "src") },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/vanilla/init.ts"),
      name: "ZentraX",
      formats: ["iife"],
      fileName: () => "main",
    },
    outDir: "dist/cdn",
    sourcemap: true,
    // Keep CSS as a separate file (style.css) rather than injecting into JS
    cssCodeSplit: false,
    rollupOptions: {
      // Bundle everything — no externals for CDN consumers
      output: {
        assetFileNames: "style.css",
        inlineDynamicImports: true,
      },
    },
  },
})
