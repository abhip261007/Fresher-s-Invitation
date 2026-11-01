import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function sqliteDatabasePlugin(): Plugin {
  return {
    name: "vite-sqlite-database-plugin",
    async configureServer(server) {
      const { handleApiRequest } = await import("./server/api.js");
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith("/api/") || req.url === "/api")) {
          handleApiRequest(req, res, next);
        } else {
          next();
        }
      });
    },
    async configurePreviewServer(server) {
      const { handleApiRequest } = await import("./server/api.js");
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith("/api/") || req.url === "/api")) {
          handleApiRequest(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), sqliteDatabasePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    watch: {
      ignored: [
        "**/data/**",
        "**/freshers.db*",
        "**/public/assets/**",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
      ],
    },
  },
});

