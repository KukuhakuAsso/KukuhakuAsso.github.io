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
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
            {
                text: "Examples",
                items: [
                    { text: "Markdown Examples", link: "/markdown-examples" },
                    { text: "Runtime API Examples", link: "/api-examples" },
                ],
            },
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
    },
    vite: {
        plugins: [
            RssPlugin({
                title: dynamicTitle,
                baseUrl: pkg.baseUrl || hostname,
                description: pkg.description || "自动生成的描述",
            }),
        ],

        server: {
            port: 5173,
            proxy,
        },
    },
});
