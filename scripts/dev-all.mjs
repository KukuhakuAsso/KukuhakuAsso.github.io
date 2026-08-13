// scripts/dev-all.mjs
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnOptions, killTree } from "./proc-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const projectTable = JSON.parse(
    fs.readFileSync(path.resolve(ROOT_DIR, "projects.json"), "utf-8"),
);

console.log("🚀 正在并发启动所有项目的开发服务器...\n");

const runningProcesses = [];

// 1. 启动 VitePress 博客
const docsServer = spawn("pnpm", ["vitepress", "dev", "docs"], {
    ...spawnOptions,
    cwd: ROOT_DIR,
});
runningProcesses.push(docsServer);

// 2. 自动遍历 JSON 表，启动所有子项目
for (const project of projectTable) {
    console.log(
        `🔗 正在拉起子项目开发服务器: ${project.name} (端口预测: ${project.devPort})`,
    );
    const subServer = spawn("pnpm", ["run", "dev"], {
        ...spawnOptions,
        cwd: path.resolve(ROOT_DIR, project.dir),
    });
    runningProcesses.push(subServer);
}

// 防抖标志，防止疯狂按 Ctrl+C 导致重复执行
let isExiting = false;

// 统一关闭管理
const killAll = () => {
    if (isExiting) return;
    isExiting = true;
    console.log("\n🛑 接收到退出信号，正在强制清场...");

    runningProcesses.forEach((proc) => killTree(proc.pid));

    console.log("✨ 所有后台进程已干净退出。\n");
    process.exit(0);
};

process.stdin.resume(); // 唤醒标准输入流
process.stdin.setEncoding("utf8");

// 如果支持 raw 模式，开启它（能更敏锐地捕获单次按键）
if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
}

// 暴力监听数据流
process.stdin.on("data", (key) => {
    // \u0003 是 Ctrl+C 的十六进制 ASCII 码
    // \u0004 是 Ctrl+D 的十六进制 ASCII 码
    if (key === "\u0003" || key === "\u0004") {
        killAll();
    }
});

process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);
