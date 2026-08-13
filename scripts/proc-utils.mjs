// scripts/proc-utils.mjs
// 子进程管理公共工具：统一 spawn 选项与进程树终止逻辑
import { execSync } from "child_process";

/**
 * 统一的子进程 spawn 选项：
 * - shell: true 便于执行 pnpm/npm 这类命令
 * - stdin 设为 ignore，防止子进程（Vite）抢占键盘输入
 * - 非 Windows 平台 detach，使子进程成为进程组组长，便于按组整体终止
 */
export const spawnOptions = {
    shell: true,
    stdio: ["ignore", "inherit", "inherit"],
    detached: process.platform !== "win32",
};

/**
 * 强制终止一个进程及其整棵子进程树
 * @param {number} pid 进程 pid
 */
export function killTree(pid) {
    if (!pid) return;
    try {
        if (process.platform === "win32") {
            // Windows 下暴力斩树
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
        } else {
            // Unix 下按进程组整体 SIGKILL（依赖 detached: true）
            process.kill(-pid, "SIGKILL");
        }
    } catch {
        // 进程可能已退出，忽略抛错
    }
}
