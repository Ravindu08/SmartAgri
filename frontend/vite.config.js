import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ── ML Service (port 8000) ──────────────────────────────────────────────
      "/predict":     { target: "http://localhost:8000", changeOrigin: true },
      "/weather":     { target: "http://localhost:8000", changeOrigin: true },
      "/cultivation": { target: "http://localhost:8000", changeOrigin: true },
      "/guidance":    { target: "http://localhost:8000", changeOrigin: true },
      "/meta":        { target: "http://localhost:8000", changeOrigin: true },
      "/health":      { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
