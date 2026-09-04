import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const now = new Date();
const buildDate = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");

const personalEventsFile = new URL(
  "./private-data/personal-events.tsv",
  import.meta.url
);

function personalEventsDevSource() {
  return {
    name: "personal-events-dev-source",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];

        if (pathname !== "/personal/personal-events.tsv") {
          next();
          return;
        }

        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET, HEAD");
          res.end();
          return;
        }

        try {
          const body = readFileSync(personalEventsFile);

          res.statusCode = 200;
          res.setHeader(
            "Content-Type",
            "text/tab-separated-values; charset=utf-8"
          );
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "HEAD") {
            res.end();
          } else {
            res.end(body);
          }
        } catch (error) {
          if (error?.code === "ENOENT") {
            res.statusCode = 404;
            res.end();
            return;
          }

          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), personalEventsDevSource()],
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_UPDATED_DATE__: JSON.stringify(buildDate),
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: "assets/chunk-[name]-[hash].js",
      },
    },
  },
});
