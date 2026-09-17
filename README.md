# Study Archive

一个以 Markdown 为内容源的个人学习档案。首页包含个人准备 Task 0，以及课程 Task 1—9；课程 Task 包含一篇任务笔记和对应的 P / D / I 阅读笔记。Markdown 不存在或仍为草稿时，入口使用低对比文字和锁形图标表示。

学习内容来自 Datawhale 与 OceanBase 社区联合共建的开源课程 [《Easy Data x AI》](https://github.com/datawhalechina/easy-data-x-ai)。感谢项目维护者与所有开源贡献者。

## 日常写作

在项目根目录执行：

```bash
# 一次性补齐所有还没有的笔记文件（已存在的不会被覆盖）
npm run new:all

# 也可以单独新建
npm run new:task -- task-2
npm run new:reading -- P1
```

`npm run new:all` 会按 `data/course.json` 把 Task 0—9 和全部 P / D / I 阅读笔记的空模版铺好，YAML 的 title、code、task、source 都已填好，正文只留标题骨架。所有新文件都是 `draft: true`，不会出现在网站上；写完内容后补上 `date`、`duration_minutes`、`summary`，再把 `draft` 改成 `false`，入口才会解锁。

笔记分别位于 `content/tasks/` 和 `content/readings/`。

- Task 笔记固定为：任务说明、Checklist、心得。
- 阅读笔记固定为：原阅读文章、Takeaway、学习过程中的随笔。

推荐的 YAML：

```yaml
---
title: 标题
task: task-2
date: 2026-09-18
duration_minutes: 90
difficulty: 3
draft: false
summary: 一句话摘要
---
```

图片统一放入 `public/assets/`，Markdown 中从生成后的文章地址引用，例如：

```html
<img src="../../assets/example.png" alt="示意图">
```

## 本地构建与预览

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:4173`。开发脚本会监听 `content/`、`data/`、`templates/` 和 `public/`；在 Obsidian 中保存 Markdown 后会自动重新构建。`draft: true` 的笔记不会生成页面，改为 `draft: false` 并保存后会自动解锁。

只需要执行一次构建时使用：

```bash
npm run build
```

`dist/` 是构建产物，不直接编辑，也不提交。

## 发布到 GitHub Pages

推送 `main` 后，GitHub Actions 会安装依赖、执行 `npm run build`，再把 `dist/` 发布到 GitHub Pages。Pages 的 Source 应设置为 **GitHub Actions**。

## 结构

```text
.
├── content/
│   ├── tasks/          # 每个 Task 一篇 Markdown
│   └── readings/       # P / D / I 阅读笔记
├── data/course.json    # 飞书 Task 进度表的结构化镜像
├── templates/          # Nunjucks 页面模板
├── scripts/            # 构建与新建笔记脚本
├── public/             # CSS、JS、图片等静态资源
├── dist/               # 自动生成，不提交
└── .github/workflows/pages.yml
```
