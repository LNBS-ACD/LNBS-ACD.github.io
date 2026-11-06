/**
 * 本地预览脚本
 * 用法: node scripts/serve.mjs
 * 然后浏览器访问 http://localhost:3000
 *
 * - 静态文件服务 site/ 目录
 * - 未匹配 URL 自动 fallback 到 404.html（模拟 GitHub Pages 行为）
 * - 支持 /news/20261106/p1/ 这类 URL 正确路由
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const PORT = 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const server = createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    // 规范化路径，防止 ../ 越狱
    let filePath = normalize(join(SITE, urlPath));
    if (!filePath.startsWith(SITE)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // 不存在 → 返回 404.html（模拟 GitHub Pages）
    if (!existsSync(filePath)) {
      const notFound = join(SITE, "404.html");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(readFileSync(notFound, "utf8"));
      return;
    }

    // 目录请求 → 尝试 index.html
    if (statSync(filePath).isDirectory()) {
      const indexFile = join(filePath, "index.html");
      if (existsSync(indexFile)) {
        filePath = indexFile;
      } else {
        const notFound = join(SITE, "404.html");
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(readFileSync(notFound, "utf8"));
        return;
      }
    } else if (!extname(filePath) && existsSync(filePath + ".html")) {
      // 无扩展名 → 尝试加 .html（如 /news/p1 → /news/p1.html）
      filePath += ".html";
    }

    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(readFileSync(filePath));
  } catch (err) {
    console.error("Request error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`预览服务器: http://localhost:${PORT}`);
  console.log(`网站根目录: ${SITE}`);
  console.log("");
  console.log("可测试的 URL:");
  console.log(`  首页        http://localhost:${PORT}/`);
  console.log(`  新闻列表    http://localhost:${PORT}/news.html`);
  console.log(`  单篇新闻    http://localhost:${PORT}/news/20261106/p1/`);
  console.log(`  关于        http://localhost:${PORT}/about.html`);
  console.log(`  图片画廊    http://localhost:${PORT}/photo.html`);
  console.log(`  直接访问图  http://localhost:${PORT}/photo/vc7heidw.jpg`);
  console.log(`  404 兜底    http://localhost:${PORT}/nonexistent`);
  console.log("");
  console.log("按 Ctrl+C 停止。");
});
