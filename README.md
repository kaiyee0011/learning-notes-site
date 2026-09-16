# Study Archive

一个以 Markdown 为内容源的个人学习档案。首页按飞书活动表展示 Task 1—9；每个 Task 包含一篇任务笔记和对应的 P / D / I 阅读笔记。Markdown 不存在或仍为草稿时，网站会显示“未解锁”。

学习内容来自 Datawhale 与 OceanBase 社区联合共建的开源课程 [《Easy Data x AI》](https://github.com/datawhalechina/easy-data-x-ai)。感谢项目维护者与所有开源贡献者。

## 日常写作

在项目根目录执行：

```bash
# 新建 Task 笔记
npm run new:task -- task-2

# 新建阅读笔记（代码来自 data/course.json）
npm run new:reading -- P1
```

笔记会分别生成到 `content/tasks/` 和 `content/readings/`。完成后补全 YAML，并把 `draft: true` 改为 `draft: false`，入口才会解锁。

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
npm run build
python3 -m http.server 4173 --directory dist
```

浏览器打开 `http://localhost:4173`。`dist/` 是构建产物，不直接编辑，也不提交。

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

学习进度的唯一依据是[飞书 Task 进度表](https://my.feishu.cn/wiki/HvQuwKiSEi0mNBkGzjBcJaldnrd)。若表格更新，先同步 `data/course.json`，再写笔记。
