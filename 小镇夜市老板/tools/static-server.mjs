import { createReadStream, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const rootDir = resolve(process.argv[2] || process.cwd());
const port = Number(process.env.PORT || process.argv[3] || 5173);
const host = process.env.HOST || "0.0.0.0";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

function resolveRequestPath(url) {
  const parsedUrl = new URL(url || "/", "http://localhost");
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname.endsWith("/")) {
    pathname = `${pathname}index.html`;
  }

  const candidate = resolve(rootDir, `.${normalize(pathname)}`);
  if (candidate !== rootDir && !candidate.startsWith(`${rootDir}${sep}`)) {
    return null;
  }
  return candidate;
}

async function findFile(pathname) {
  const stats = await stat(pathname).catch(() => null);
  if (!stats) {
    return null;
  }
  if (stats.isDirectory()) {
    const indexPath = join(pathname, "index.html");
    const indexStats = await stat(indexPath).catch(() => null);
    return indexStats?.isFile() ? { path: indexPath, stats: indexStats } : null;
  }
  return stats.isFile() ? { path: pathname, stats } : null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  const requestPath = resolveRequestPath(request.url);
  if (!requestPath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  const file = await findFile(requestPath);
  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  const contentType = mimeTypes.get(extname(file.path).toLowerCase()) || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": file.stats.size,
    "Cache-Control": "no-cache",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(file.path).pipe(response);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.listen({ port, host, backlog: 512 }, () => {
  const stats = statSync(rootDir);
  if (!stats.isDirectory()) {
    throw new Error(`Static root is not a directory: ${rootDir}`);
  }
  console.log(`Serving ${rootDir} at http://${host}:${port}`);
});
