# LNBS-ACD 官方网站

纯静态 GitHub Pages 项目，无构建依赖，Node.js 驱动。

## 目录结构

```
LNBS-ACD website/
├── data/
│   └── site.json          # 所有数据：站点配置、轮播、新闻、关于内容
├── src/
│   ├── styles.css         # 样式表
│   └── app.js             # 前端脚本（轮播、分页、导航高亮）
├── photo/                 # 图片源文件（构建时复制到 site/photo/）
├── scripts/
│   └── build.mjs          # 构建脚本（node scripts/build.mjs）
└── site/                  # 构建产物（提交到 GitHub Pages 的目录）
    ├── index.html
    ├── news.html
    ├── news.json          # 新闻列表数据（供 JS 分页）
    ├── news/
    │   └── p{id}.html     # 单篇新闻页
    ├── about.html
    ├── photo.html
    ├── 404.html           # 智能兜底路由
    ├── styles.css
    ├── app.js
    └── photo/            # 图片文件
```

## 构建

```bash
node scripts/build.mjs
```

构建脚本会：
1. 读取 `data/site.json`
2. 清理 `site/` 目录
3. 复制 `photo/` 下的图片到 `site/photo/`
4. 复制 `src/styles.css` 和 `src/app.js` 到 `site/`
5. 生成所有 HTML 页面到 `site/`

## 更新内容

只需编辑 `data/site.json`，然后运行 `node scripts/build.mjs`，将 `site/` 目录推送到 GitHub Pages 的部署分支。

### 添加新闻

在 `data/site.json` 的 `news` 数组中追加：

```json
{
  "id": 5,
  "date": "2026-11-10",
  "title": "新闻标题",
  "summary": "一句话摘要",
  "body": "<p>正文 HTML</p>"
}
```

- `id` 必须唯一递增
- 生成的 URL：`/news/20261110/p5/`（通过 `404.html` 兜底路由到 `/news/p5.html`）

### 添加图片

将图片文件放入 `photo/` 目录，重新构建。图片可通过 `/photo/<filename>` 直接访问，
`photo.html` 页面会自动列出所有图片。

## URL 路由

| URL | 说明 |
|-----|------|
| `/` 或 `/index.html` | 首页 |
| `/news.html` | 新闻列表（每页 10 条，JS 分页） |
| `/news/<yyyymmdd>/p<id>/` | 单篇新闻（404.html 重定向到 `/news/p<id>.html`） |
| `/about.html` | 关于页面 |
| `/photo.html` | 图片画廊 |
| `/photo/<file>` | 直接访问图片 |

## 部署

1. 运行 `node scripts/build.mjs`
2. 将 `site/` 目录内容推送到 GitHub Pages 的部署分支（如 `gh-pages`）
3. 或直接在 GitHub 仓库中勾选 Pages → Source → gh-pages
