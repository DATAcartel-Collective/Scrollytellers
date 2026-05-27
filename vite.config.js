import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from 'url';

const dummyPath = fileURLToPath(new URL('./src/dummy.js', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@lancedb/lancedb": dummyPath
    }
  },
  optimizeDeps: {
    exclude: ["@lancedb/lancedb", "@electric-sql/pglite"], // Required for WASM stability
  },
  worker: {
    format: "es",
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer and WebGPU multi-threading
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  }
});