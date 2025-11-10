import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Use project root as the base directory
const rootDir = process.cwd();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
    },
    appType: "custom",
  });

  // Vite middlewares (static files, HMR, etc.)
  app.use(vite.middlewares);

  // Catch-all to serve index.html in dev
  app.use(/.*/, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(rootDir, "client", "index.html");

      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Match Vite's build output: dist/public
  const distPath = path.resolve(rootDir, "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use(/.*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
