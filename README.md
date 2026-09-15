# Study Archive

一个无需构建工具的个人学习档案静态站点。首页展示学习进度表，单篇页面保存心得、截图与课程入口。

学习内容来自 Datawhale 与 OceanBase 社区联合共建的开源课程 [《Easy Data x AI》](https://github.com/datawhalechina/easy-data-x-ai)。感谢项目维护者与所有开源贡献者。

## 本地预览

```bash
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000`。

## 新增学习记录

1. 在 `notes/` 新建一篇 HTML 笔记。
2. 把图片放进 `assets/`，使用相对路径引用。
3. 在 `index.html` 的 `<tbody id="log-body">` 中复制一行并修改内容。
4. 更新首页 `CURRENT INDEX` 与三项摘要中的真实数字。

## 发布到 GitHub Pages

1. 在 GitHub 创建空仓库，例如 `learning-notes`。
2. 将本目录推送到仓库的 `main` 分支。
3. 打开仓库 **Settings → Pages**，Source 选择 **GitHub Actions**。
4. `.github/workflows/pages.yml` 会自动发布本站。

> 首次创建远程仓库后，请把 `index.html` 中指向 `https://github.com/` 的链接替换成真实仓库地址。

## 结构

```text
.
├── index.html
├── styles.css
├── script.js
├── notes/
├── assets/
└── .github/workflows/pages.yml
```
