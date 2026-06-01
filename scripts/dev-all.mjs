// scripts/dev-all.mjs
import { spawn, execSync } from "child_process"; // 💡 引入 execSync 用来执行同步命令
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const projectTable = JSON.parse(
    fs.readFileSync(path.resolve(ROOT_DIR, "projects.json"), "utf-8"),
);

console.log("🚀 正在并发启动所有项目的开发服务器...\n");

const runningProcesses = [];

// 1. 启动 VitePress 博客
const docsServer = spawn("npx", ["vitepress", "dev", "docs"], {
    cwd: ROOT_DIR,
    shell: true,
    stdio: "inherit",
});
runningProcesses.push(docsServer);

// 2. 自动遍历 JSON 表，启动所有子项目
for (const project of projectTable) {
    console.log(
        `🔗 正在拉起子项目开发服务器: ${project.name} (端口预测: ${project.devPort})`,
    );
    const subServer = spawn("npm", ["run", "dev"], {
        cwd: path.resolve(ROOT_DIR, project.dir),
        shell: true,
        stdio: "inherit",
    });
    runningProcesses.push(subServer);
}

// 统一关闭管理（针对 Windows 进程树优化版）
const killAll = () => {
    console.log("\n🛑 正在强制关闭所有开发服务器及子进程...");

    runningProcesses.forEach((proc) => {
        if (proc.pid) {
            try {
                // 🎯 关键修复：使用 Windows 原生 taskkill 连带 shell 和它底下的 Vite 一起端掉
                // /PID 指定进程号，/T 顺藤摸瓜杀掉所有子进程，/F 强制执行
                execSync(`taskkill /pid ${proc.pid} /T /F`, {
                    stdio: "ignore",
                });
            } catch (e) {
                // 如果进程已经提前死了，兜底用普通 kill 释放内存
                proc.kill();
            }
        }
    });

    console.log("✨ 所有后台进程已干净退出。\n");
    process.exit();
};

// 监听终端退出事件
process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);
