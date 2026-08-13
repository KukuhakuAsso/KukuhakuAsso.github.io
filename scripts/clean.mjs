// scripts/clean.mjs
// 清理本地临时构建文件（缓存、构建产物）。
// 默认保留 dist-preview；加 --all 或 --dist-preview 时一并删除。
// 用法:
//   node scripts/clean.mjs                # 清理临时文件，保留 dist-preview
//   node scripts/clean.mjs --all          # 连 dist-preview 一起删
//   node scripts/clean.mjs --dist-preview # 连 dist-preview 一起删
//   node scripts/clean.mjs --dry          # 只预览，不真正删除
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const includeDistPreview =
    args.includes("--all") || args.includes("--dist-preview");

// 固定清理项：缓存 / 中间构建产物（均为 .gitignore 中声明、可重新生成的文件）
const cleanupPaths = [
    "docs/.vitepress/cache",
    "docs/.vitepress/dist",
    "dist",
    ".vite",
    ".eslintcache",
    ".stylelintcache",
    ".tsbuildinfo",
];

// 从 projects.json 动态收集各子项目的产物目录与 Vite 缓存
let projects = [];
try {
    projects = JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, "projects.json"), "utf-8"),
    );
} catch {
    // projects.json 不存在或解析失败时忽略，继续清理固定项
}

for (const p of projects) {
    if (!p.dir) continue;
    if (p.outputDir) {
        cleanupPaths.push(path.join(p.dir, p.outputDir));
    }
    cleanupPaths.push(path.join(p.dir, "node_modules", ".vite"));
}

// 可选：dist-preview（合并后的最终预览产物）
if (includeDistPreview) {
    cleanupPaths.push("dist-preview");
}

function dirSize(dir) {
    let total = 0;
    try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                total += dirSize(full);
            } else if (entry.isFile()) {
                try {
                    total += fs.statSync(full).size;
                } catch {
                    // 忽略单文件统计失败
                }
            }
        }
    } catch {
        // 目录不可读时返回 0
    }
    return total;
}

function fmt(bytes) {
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
    if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
}

let freed = 0;
const removed = [];
const missing = [];

for (const rel of cleanupPaths) {
    const abs = path.resolve(ROOT_DIR, rel);
    if (!fs.existsSync(abs)) {
        missing.push(rel);
        continue;
    }
    const size = dirSize(abs);
    const displayRel = rel.replace(/\\/g, "/");
    if (dryRun) {
        console.log(`[dry-run] 将删除 ${displayRel} (${fmt(size)})`);
    } else {
        try {
            fs.rmSync(abs, { recursive: true, force: true });
            console.log(`🗑️  已删除 ${displayRel} (${fmt(size)})`);
        } catch (err) {
            console.error(`❌ 删除失败 ${rel}: ${err.message}`);
            continue;
        }
    }
    removed.push(rel);
    freed += size;
}

console.log("\n" + "=".repeat(48));
if (removed.length) {
    console.log(
        `${dryRun ? "[dry-run] 预计" : "共"}释放空间: ${fmt(freed)}（${removed.length} 项）`,
    );
} else {
    console.log("没有需要清理的文件");
}
if (!includeDistPreview) {
    console.log(
        "ℹ️  已保留 dist-preview（如需一并删除，加 --all 或 --dist-preview）",
    );
}
if (missing.length) {
    console.log(
        `ℹ️  以下路径不存在，已跳过: ${missing.map((r) => r.replace(/\\/g, "/")).join(", ")}`,
    );
}
