/**
 * LNBS-ACD 静态站点构建脚本
 * 用法: node scripts/build.mjs
 *
 * 读取 data/site.json，生成 site/ 下的所有静态文件。
 * 修改内容只需编辑 data/site.json，然后重新运行构建并推送。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const SRC = join(ROOT, "src");
const PHOTO_SRC = join(ROOT, "photo");
const PHOTO_OUT = join(SITE, "photo");

const config = JSON.parse(readFileSync(join(ROOT, "data", "site.json"), "utf8"));
const NEWS_PAGE_SIZE = 10;

// ---------- 工具 ----------
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function ymd(date) { return date.replace(/-/g, ""); }
function write(rel, content) {
  const p = join(SITE, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
  console.log("  write", rel);
}

// ---------- 公共模板 ----------
function head(title, extraHead = "") {
  const navLinks = config.nav
    .map((n) => `      <a class="site-nav-link" href="${esc(n.url)}" data-nav="${esc(n.url)}">${esc(n.label)}</a>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<link rel="icon" type="image/png" href="${esc(config.logoUrl)}">
<link rel="stylesheet" href="/styles.css">
${extraHead}
</head>
<body>
<div class="site-banner">
  <a class="site-banner-inner" href="/index.html">
    <img class="site-banner-logo" src="${esc(config.logoUrl)}" alt="LNBS-ACD logo">
    <div class="site-banner-text">
      <span class="site-banner-name">${esc(config.name)}</span>
      <span class="site-banner-tagline">${esc(config.tagline)}</span>
    </div>
  </a>
</div>
<header class="site-header">
  <div class="container site-header-inner">
    <nav class="site-nav">
${navLinks}
    </nav>
  </div>
</header>
<main>
`;
}

function footer() {
  return `</main>
<footer class="site-footer">
  <div class="container">
    <p>&copy; 2026 ${esc(config.name)}. Powered by Curiosity and Chocolate.</p>
  </div>
</footer>
</body>
</html>
`;
}

// ---------- 1. 清理 site/ ----------
rmSync(SITE, { recursive: true, force: true });
mkdirSync(join(SITE, "news"), { recursive: true });
mkdirSync(PHOTO_OUT, { recursive: true });

// ---------- 2. 复制图片 ----------
if (existsSync(PHOTO_SRC)) {
  for (const f of readdirSync(PHOTO_SRC)) {
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)) {
      copyFileSync(join(PHOTO_SRC, f), join(PHOTO_OUT, f));
      console.log("  copy photo", f);
    }
  }
}

// ---------- 3. 静态资产 ----------
copyFileSync(join(SRC, "styles.css"), join(SITE, "styles.css"));
copyFileSync(join(SRC, "app.js"), join(SITE, "app.js"));
console.log("  copy styles.css, app.js");

// ---------- 4. 首页 ----------
const carousels = config.carousels || [];
const homeNews = config.news.slice(0, 3);
const slides = carousels
  .map((c, i) => {
    const cls = i === 0 ? " is-active" : "";
    return `        <a class="carousel-slide${cls}" href="${esc(c.link)}" target="_blank" rel="noopener">
          <img src="${esc(c.image)}" alt="${esc(c.title)}">
          <span class="carousel-caption"><strong>${esc(c.title)}</strong><small>${esc(c.sub || "")}</small></span>
        </a>`;
  })
  .join("\n");
const dots = carousels
  .map((_, i) => `          <span class="carousel-dot${i === 0 ? " is-active" : ""}" data-index="${i}"></span>`)
  .join("\n");
const briefs = homeNews
  .map((n) => {
    const href = `/news/${ymd(n.date)}/p${n.id}/`;
    return `        <a class="news-brief" href="${href}">
          <span class="news-brief-title">${esc(n.title)}</span>
          <span class="news-brief-meta">${esc(n.date)} &middot; ${esc(n.summary)}</span>
        </a>`;
  })
  .join("\n");
write(
  "index.html",
  head(`${config.name} - ${config.tagline}`) +
    `<section class="home-feature">
  <div class="container home-feature-grid">
    <div class="carousel-wrap">
      <div class="carousel" id="carousel">
${slides}
        <button class="carousel-btn carousel-prev" id="carousel-prev" aria-label="上一张" type="button">&lsaquo;</button>
        <button class="carousel-btn carousel-next" id="carousel-next" aria-label="下一张" type="button">&rsaquo;</button>
        <div class="carousel-dots" id="carousel-dots">
${dots}
        </div>
      </div>
    </div>
    <div class="home-news">
      <h2 class="section-title">最新新闻</h2>
      <div class="news-brief-list">
${briefs}
      </div>
      <a class="btn-more" href="/news.html">查看全部新闻 &rarr;</a>
    </div>
  </div>
</section>
` + footer()
);

// ---------- 5. 新闻列表页 ----------
write(
  "news.html",
  head(`新闻 - ${config.name}`) +
    `<section class="page-section">
  <div class="container">
    <h1 class="page-title">新闻</h1>
    <div id="news-list"></div>
    <div class="news-pager" id="news-pager"></div>
  </div>
</section>
` + footer()
);
write("news.json", JSON.stringify({ pageSize: NEWS_PAGE_SIZE, items: config.news }, null, 2));

// ---------- 6. 每个新闻页 ----------
for (const item of config.news) {
  const otherLinks = config.news
    .filter((n) => n.id !== item.id)
    .map((n) => `      <a class="news-single-link" href="/news/${ymd(n.date)}/p${n.id}/">${esc(n.title)}</a>`)
    .join("\n");
  write(
    `news/p${item.id}.html`,
    head(`${item.title} - ${config.name}`) +
      `<section class="page-section">
  <div class="container news-single">
    <a class="news-back" href="/news.html">&larr; 返回新闻列表</a>
    <article class="news-article">
      <h1 class="news-article-title">${esc(item.title)}</h1>
      <p class="news-article-date">${esc(item.date)}</p>
      <div class="news-article-body">
${item.body}
      </div>
    </article>
    <nav class="news-single-nav">
${otherLinks}
    </nav>
  </div>
</section>
` + footer()
  );
}

// ---------- 7. 图片页 ----------
const photoFiles = existsSync(PHOTO_OUT) ? readdirSync(PHOTO_OUT).filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)) : [];
const photoCards = photoFiles
  .map((f) => {
    const label = f.replace(/\.\w+$/, "");
    return `      <a class="photo-card" href="/photo/${f}" target="_blank" rel="noopener">
        <img src="/photo/${f}" alt="${esc(label)}" loading="lazy">
        <div class="photo-card-caption">/${esc(f)}</div>
      </a>`;
  })
  .join("\n");
write(
  "photo.html",
  head(`图片 - ${config.name}`) +
    `<section class="page-section photo-page">
  <div class="container">
    <h1 class="page-title">图片</h1>
    <p class="text-dim">共 ${photoFiles.length} 张图片，点击可直接访问 /photo/ 下的原图。</p>
    ${photoCards ? `<div class="photo-grid">\n${photoCards}\n    </div>` : '<p class="text-dim">暂无图片，请将图片放入 photo/ 目录后重新构建。</p>'}
  </div>
</section>
` + footer()
);

// ---------- 8. 关于页 ----------
const about = config.about || {};
const aboutParas = (about.paragraphs || []).map((p) => `      <p>${esc(p)}</p>`).join("\n");
const aboutLinks = (about.links || [])
  .map((l) => `      <a class="btn-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
  .join("\n");
write(
  "about.html",
  head(`关于 - ${config.name}`) +
    `<section class="page-section">
  <div class="container">
    <h1 class="page-title">${esc(about.title || "关于")}</h1>
${aboutParas}
${aboutLinks ? `
    <div class="about-links">
${aboutLinks}
    </div>` : ""}
  </div>
</section>
` + footer()
);

// ---------- 9. 404.html（智能兜底路由） ----------
write(
  "404.html",
  head(`404 - ${config.name}`, `<style>
  .img-view { text-align: center; padding: 40px 0; }
  .img-view img { max-width: 90%; max-height: 80vh; border-radius: 8px; border: 1px solid var(--border); }
  .notfound { padding: 60px 0; text-align: center; }
  .notfound h1 { font-size: 4rem; color: var(--accent); margin: 10px 0; }
</style>
<script>
(function () {
  var p = location.pathname;
  var m = p.match(/^\\/news\\/(\\d{8})\\/p(\\d+)\\/?$/);
  if (m) { location.replace('/news/p' + m[2] + '.html'); return; }
  if (p.indexOf('/photo/') === 0) {
    var nf = document.getElementById('nf');
    var iv = document.getElementById('img-view');
    if (nf) nf.style.display = 'none';
    if (iv) { iv.style.display = ''; }
    var img = document.createElement('img');
    img.src = p;
    if (iv) iv.appendChild(img);
    document.title = '${esc(config.name)} 图片';
    return;
  }
  var nm = p.match(/^\\/news\\/p(\\d+)\\.html/);
  if (nm) { location.replace('/news/p' + nm[1] + '.html'); return; }
})();
</script>`) +
    `<section class="img-view" id="img-view" style="display:none;">
  <div class="container"><p class="text-dim">图片</p></div>
</section>
<section class="notfound" id="nf">
  <div class="container">
    <h1>404</h1>
    <p class="text-dim">页面不存在或已移动。</p>
    <p><a class="btn-link" href="/index.html">返回首页</a></p>
  </div>
</section>
` + footer()
);

console.log("\n构建完成。输出目录: site/");
console.log("将 site/ 目录的内容提交到仓库（GitHub Pages 的部署分支）即可。");
