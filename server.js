import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "./server/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.resolve(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".csv": "text/csv",
  ".mp4": "video/mp4",
};

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/")) {
    handleApiRequest(req, res);
    return;
  }

  // Static file serving from dist
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(
      DIST_DIR,
      req.url === "/" ? "index.html" : req.url.split("?")[0]
    );

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback
    const indexPath = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found. Run `npm run build` or use `npm run dev` to start the development server.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`========================================================`);
  console.log(`  SAARTHI 2026 Production Server is running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://0.0.0.0:${PORT}`);
  console.log(`  Database: SQLite (data/freshers.db)`);
  console.log(`========================================================`);
});
