/**
 * NPM library build — produces dist/index.mjs + dist/index.js + dist/styles.css
 * Peer dependencies are externalized (React, wagmi, viem, etc.)
 * Types are emitted separately via `build:types` (tsc).
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
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.js"),
    },
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "react-dom",
        "wagmi",
        "viem",
        "@tanstack/react-query",
        "@rainbow-me/rainbowkit",
        /^@rainbow-me\/rainbowkit\/.*/,
        /^@zentrafi\/.*/,
      ],
      output: {
        assetFileNames: "styles.css",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
  },
})
