import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { watch } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);
const watchRoots = ["content", "data", "templates", "public"].map((item) => path.join(root, item));

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

let building = false;
let buildQueued = false;
let debounceTimer;

function runBuild(reason = "change") {
  if (building) {
    buildQueued = true;
    return Promise.resolve();
  }

  building = true;
  console.log(`\n[dev] Building after ${reason}...`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, "scripts/build.mjs")], {
      cwd: root,
      stdio: "inherit",
    });

    child.on("exit", async (code) => {
      building = false;
      if (code === 0) console.log("[dev] Build complete. Refresh the browser.");
      else console.error(`[dev] Build failed with exit code ${code}.`);

      resolve();

      if (buildQueued) {
        buildQueued = false;
        await runBuild("queued changes");
      }
    });
  });
}

function shouldIgnore(filename = "") {
  const normalized = String(filename).replaceAll("\\", "/");
  return (
    normalized.includes("/.obsidian/") ||
    normalized.startsWith(".obsidian/") ||
    normalized.endsWith(".DS_Store") ||
    normalized.endsWith("~") ||
    normalized.endsWith(".tmp")
  );
}

function scheduleBuild(filename) {
  if (shouldIgnore(filename)) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runBuild(filename || "a source change"), 250);
}

function safeTarget(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlPath, "http://localhost").pathname);
  } catch {
    return null;
  }

  let relativePath = pathname.replace(/^\/+/, "");
  if (!relativePath || pathname.endsWith("/")) relativePath += "index.html";

  const target = path.resolve(distDir, relativePath);
  if (target !== distDir && !target.startsWith(`${distDir}${path.sep}`)) return null;
  return target;
}

async function serve(request, response) {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405).end("Method not allowed");
    return;
  }

  let target = safeTarget(request.url);
  if (!target) {
    response.writeHead(400).end("Bad request");
    return;
  }

  try {
    const stats = await fs.stat(target);
    if (stats.isDirectory()) target = path.join(target, "index.html");
    await fs.access(target);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  const contentType = mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });

  if (request.method === "HEAD") response.end();
  else createReadStream(target).pipe(response);
}

await runBuild("startup");

const watchers = watchRoots.map((directory) =>
  watch(directory, { recursive: true }, (_event, filename) => scheduleBuild(filename)),
);

const server = http.createServer((request, response) => {
  serve(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) response.writeHead(500);
    response.end("Internal server error");
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[dev] Port ${port} is already in use. Stop the existing preview server first.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[dev] Watching content, data, templates and public.`);
  console.log(`[dev] Preview: http://127.0.0.1:${port}/`);
});

function shutdown() {
  clearTimeout(debounceTimer);
  for (const watcher of watchers) watcher.close();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
