// build-all.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

// ================= 🛠️ 多项目维护表 =================
const projectTable = JSON.parse(
    fs.readFileSync(path.resolve(ROOT_DIR, "projects.json"), "utf-8"),
);

// ✨ 优化：直接将预览总目录生成在项目根目录下，方便管理
const DIST_PREVIEW = path.resolve(ROOT_DIR, "dist-preview");

try {
    // 1. 清理并创建测试总目录
    if (fs.existsSync(DIST_PREVIEW)) {
        console.log("🧹 正在清理旧的 dist-preview 目录...");
        fs.rmSync(DIST_PREVIEW, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_PREVIEW, { recursive: true });

    // 2. 构建 VitePress 博客本体
    console.log("📦 正在构建 VitePress 博客...");
    // ✨ 修复：显式指定在 ROOT_DIR 下执行命令，防止找不到 docs 目录
    execSync("npx vitepress build docs", { cwd: ROOT_DIR, stdio: "inherit" });

    // 复制博客产物
    const vitepressDist = path.resolve(ROOT_DIR, "docs/.vitepress/dist");
    fs.cpSync(vitepressDist, DIST_PREVIEW, { recursive: true });

    // 3. 动态遍历构建表中的子项目
    for (const project of projectTable) {
        console.log(`\n🚀 发现子项目 [${project.name}]，开始构建...`);

        // ✨ 优化：计算出子项目的绝对路径
        const absoluteProjectDir = path.resolve(ROOT_DIR, project.dir);

        // ✨ 修复：直接切换到子项目目录下执行 build，比 --prefix 更稳健
        execSync(`npm run build`, {
            cwd: absoluteProjectDir,
            stdio: "inherit",
        });

        // ✨ 关键修复：改用 ROOT_DIR 解析源文件路径，不再误入 scripts 文件夹
        const sourceDir = path.resolve(
            ROOT_DIR,
            project.dir,
            project.outputDir,
        );
        const targetDir = path.resolve(DIST_PREVIEW, project.subPath);

        console.log(
            `🚚 正在将 [${project.name}] 产物合并至 dist-preview/${project.subPath}...`,
        );
        fs.mkdirSync(targetDir, { recursive: true });
        fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
    }

    console.log(
        "\n✨ 所有项目构建并合并成功！产物位于项目根目录的 /dist-preview",
    );
} catch (error) {
    console.error("\n❌ 构建失败:", error);
    process.exit(1);
}
