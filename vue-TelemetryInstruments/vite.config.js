import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// vite文档 https://vite.dev/config/
// 调试环境时请使用.env.local修改参数覆盖.env.development中的默认值
export default defineConfig(({ mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, process.cwd(), "");

    // .env.development.local 覆盖 .env.development 的同名变量（优先级更高，已 gitignore）
    const scfTarget = env.API_SCF_TARGET;
    const scfRewrite = env.API_SCF_REWRITE === "true";

    return {
        base: "/TelemetryInstruments/",
        server: {
            proxy: {
                "/api-scf": {
                    target: scfTarget,
                    changeOrigin: true,
                    ...(scfRewrite && {
                        rewrite: (path) => path.replace(/^\/api-scf/, ""),
                    }),
                },
            },
            port: 5175, // 固定端口，避免随机占用
        },
        plugins: [vue()],
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "src"), // 将 @ 映射到 src 目录
            },
        },
        build: {
            outDir: "./output",
            emptyOutDir: true,
        },
    };
});
