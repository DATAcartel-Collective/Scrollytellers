import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"], // Required for WASM stability
  },
  worker: {
    format: "es",
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer and WebGPU multi-threading
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  }
});