import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false,
    proxy: {
      // ── Main Backend (port 8001) — auth, farms, crops ──────────────────────
      "/auth":   { target: "http://localhost:8001", changeOrigin: true },
      "/api":    { target: "http://localhost:8001", changeOrigin: true },
      // ── ML Service (port 8000) ──────────────────────────────────────────────
      "/predict":     { target: "http://localhost:8000", changeOrigin: true },
      "/weather":     { target: "http://localhost:8000", changeOrigin: true },
      "/cultivation": { target: "http://localhost:8000", changeOrigin: true },
      "/guidance":    { target: "http://localhost:8000", changeOrigin: true },
      "/meta":        { target: "http://localhost:8000", changeOrigin: true },
      "/health":      { target: "http://localhost:8001", changeOrigin: true },
    },
  },
});
