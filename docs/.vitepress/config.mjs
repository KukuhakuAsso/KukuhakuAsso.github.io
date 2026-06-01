import { defineConfig } from "vitepress";
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
// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "空白解谜组",
    description: "空白永不败北",
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
        server: {
            port: 5173,
            proxy,
        },
    },
});
