import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false,
    proxy: {
      // ── Main Backend (port 8000) — auth, farms, crops, marketplace, admin ──
      "/auth": { target: "http://localhost:8000", changeOrigin: true },
      "/api":  { target: "http://localhost:8000", changeOrigin: true },
      // ── ML Service (port 8001) — AI, weather, guidance, cultivation ─────────
      "/predict":     { target: "http://localhost:8001", changeOrigin: true },
      // bypass HTML requests so the browser can navigate to /weather as a React route
      "/weather":     { target: "http://localhost:8001", changeOrigin: true, bypass: req => req.headers.accept?.includes('text/html') ? '/index.html' : null },
      "/cultivation": { target: "http://localhost:8001", changeOrigin: true },
      "/guidance":    { target: "http://localhost:8001", changeOrigin: true },
      "/meta":        { target: "http://localhost:8001", changeOrigin: true },
      "/health":      { target: "http://localhost:8001", changeOrigin: true },
    },
  },
});
