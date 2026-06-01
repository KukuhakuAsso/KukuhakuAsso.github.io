import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    base: "/vue-telemetry/",
    server: {
        port: 5175, // 固定端口，避免随机占用
    },
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"), // 关键：将 @ 映射到 src 目录
        },
    },
    build: {
        outDir: "./output",
        emptyOutDir: true,
    },
});
