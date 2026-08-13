import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

// vite文档 https://vite.dev/config/
// 调试环境时请使用.env.local修改参数覆盖.env.development中的默认值

// 单一数据源：子项目的 base / port / 代理前缀 / 输出目录 统一从根目录 projects.json 读取，
// 与主站 config.mjs 的代理转发配置保持一致，避免重复维护。
const PROJECT_DIR = path.resolve(import.meta.dirname);
const ROOT_DIR = path.resolve(PROJECT_DIR, "..");
const projects = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "projects.json"), "utf-8"),
);
const self = projects.find(
    (p) => path.resolve(ROOT_DIR, p.dir) === PROJECT_DIR,
);

if (!self) {
    console.warn("[vite] 未在 projects.json 中找到当前子项目配置，将使用默认值");
}

const subPath = self?.subPath ?? "TelemetryInstruments";
const devPort = self?.devPort ?? 5175;
const proxyApi = self?.proxyApi ?? ["/api-scf"];
const outputDir = self?.outputDir ?? "output";

// 转义正则特殊字符，避免代理前缀被当作正则表达式解析
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default defineConfig(({ mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, process.cwd(), "");

    // .env.development.local 覆盖 .env.development 的同名变量（优先级更高，已 gitignore）
    const scfTarget = env.API_SCF_TARGET;
    const scfRewrite = env.API_SCF_REWRITE === "true";

    // 代理前缀来自 projects.json，目标地址来自环境变量
    const proxy = {};
    for (const prefix of proxyApi) {
        proxy[prefix] = {
            target: scfTarget,
            changeOrigin: true,
            ...(scfRewrite && {
                rewrite: (p) =>
                    p.replace(new RegExp(`^${escapeRegExp(prefix)}`), ""),
            }),
        };
    }

    return {
        base: `/${subPath}/`,
        server: {
            proxy,
            port: devPort, // 端口来自 projects.json
        },
        plugins: [vue()],
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "src"), // 将 @ 映射到 src 目录
            },
        },
        build: {
            outDir: outputDir,
            emptyOutDir: true,
        },
    };
});
