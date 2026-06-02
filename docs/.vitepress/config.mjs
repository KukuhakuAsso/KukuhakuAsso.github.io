import { defineConfig } from "vitepress";
import { RssPlugin } from "vitepress-plugin-rss";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const projects = JSON.parse(
    fs.readFileSync(path.join(ROOT, "projects.json"), "utf-8"),
);

const proxy = {};
projects.forEach((project) => {
    if (project.subPath && project.devPort) {
        proxy[`/${project.subPath}`] = `http://localhost:${project.devPort}`;
    }
});

// 1. 从 package.json 中动态读取 name 或 description
const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

// 2. 或者从系统环境变量中读取（比如多环境部署时很有用）
const dynamicTitle = process.env.RSS_TITLE || pkg.RSS_TITLE || "默认博客";
const dynamicDescription =
    process.env.RSS_DESCRIPTION || pkg.RSS_DESCRIPTION || "默认博客描述";

const hostname = "https://kukuhakuasso.github.io/";

export default defineConfig({
    title: dynamicTitle,
    description: dynamicDescription,
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "首页", link: "/" },
            // 下拉菜单格式：把所有的谜题或工具聚合在一起
            {
                text: "神秘学研究",
                items: [
                    { text: "ARG 谜题档案", link: "/puzzles/" },
                    { text: "神秘学论文", link: "/lore/" },
                    { text: "解谜常用工具", link: "/tools/" },
                ],
            },
            { text: "关于空白", link: "/about" },
        ],

        darkModeSwitchLabel: "夜间模式",
        lightModeSwitchTitle: "切换到浅色模式",
        darkModeSwitchTitle: "切换到深色模式",

        socialLinks: [
            {
                icon: "bilibili",
                link: "https://space.bilibili.com/3706992621258932",
            },
            {
                icon: "github",
                link: "https://github.com/KukuhakuAsso/KukuhakuAsso.github.io",
            },
        ],
    },
    vite: {
        plugins: [
            RssPlugin({
                title: dynamicTitle,
                baseUrl: pkg.baseUrl || hostname,
                description: dynamicDescription || "自动生成的描述",
                filename: 'feed.xml',
                filter: (page) => {
                    // 仅当页面路由以 /posts/ 且没有显式设置 rss: false 开头时才包含在 RSS 中
                    return (
                        page.url.startsWith("/posts/") &&
                        page.frontmatter.rss !== false
                    );
                },
            }),
        ],

        server: {
            port: 5173,
            proxy,
        },
    },
});
