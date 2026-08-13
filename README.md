# 空白组谜题设计

空白解谜组（Ku2uhakuAsso）的官方网站。

- 镜像网页(暂时为跳转链接)：[KukuhakuAsso.github.io](https://KukuhakuAsso.github.io)
- 官网：[www.ku2hakuasso.site](https://www.ku2hakuasso.site)

## 项目构成

本项目是 pnpm monorepo，包含一个 VitePress 主站与一个 Vue 子项目。

### 主站（docs/）

基于 VitePress 构建的静态站点，包含以下页面：

| 页面         | 路径          | 说明                       |
| ------------ | ------------- | -------------------------- |
| 首页         | `/`         | 站点入口                   |
| 博客         | `/blog/`    | 开发日志                   |
| ARG 谜题档案 | `/puzzles/` | 谜题档案索引               |
| 神秘学论文   | `/lore/`    | 神秘学研究文章             |
| 解谜常用工具 | `/tools/`   | 工具索引                   |
| 文章         | `/posts/`   | 谜题、论文、工具等正文内容 |
| 关于空白     | `/about`    | 组织介绍                   |
| 关注         | `/follow`   | 关注方式                   |

### 子项目（vue-TelemetryInstruments/）

Puzzle解谜游戏「TelemetryInstruments」，Vue 3 + Vite 构建的单页应用，部署在 `/TelemetryInstruments/` 子路径下。

## 技术栈

- [VitePress](https://vitepress.dev) 2.x
- Vue 3.5
- Vite 8
- Node.js 20+
- pnpm

## 环境要求

- Node.js 20 或更高版本
- pnpm（推荐 10 或更高版本）

## 目录结构

```
.
├── docs/                      # VitePress 主站
│   ├── .vitepress/            # 站点配置与自定义主题
│   ├── posts/                 # 文章正文
│   ├── puzzles/ lore/ tools/  # 各栏目索引页
│   └── public/                # 静态资源（图片、PDF 等）
├── vue-TelemetryInstruments/  # 子项目：解谜 SPA
├── scripts/                   # 构建与开发编排脚本
├── projects.json              # 子项目构建配置表
└── dist-preview/              # 构建产物（已 gitignore）
```

## 安装

```bash
pnpm install
```

## 构建方法

| 命令                    | 说明                                            |
| ----------------------- | ----------------------------------------------- |
| `pnpm run dev`        | 并发启动主站与所有子项目的开发服务器            |
| `pnpm run proj:dev`   | 单独启动某个子项目的开发服务器（交互式选择）    |
| `pnpm run docs:dev`   | 仅启动 VitePress 主站开发服务器                 |
| `pnpm run build`      | 构建主站与所有子项目，并合并到`dist-preview/` |
| `pnpm run docs:build` | 仅构建 VitePress 主站                           |
| `pnpm run preview`    | 本地预览`dist-preview/` 构建产物              |

构建时，脚本会根据 `projects.json` 中的 `buildCmd` 字段执行子项目构建；若该命令失败，则回退到默认命令 `pnpm run build`。
