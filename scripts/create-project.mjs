// scripts/create-project.mjs
// 快速创建新的子项目，并自动注册到 projects.json 与 pnpm-workspace.yaml
// 用法:
//   node scripts/create-project.mjs <项目名> [--dir <目录>] [--port <端口>] [--subpath <子路径>] [--proxy <前缀,可多次>]
// 示例:
//   node scripts/create-project.mjs MyGame --subpath MyGame --proxy /api-mygame
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(__dirname, "templates", "subproject");

// ---------- 路径归一化（兼容 cmd / PowerShell / Git Bash 的 MSYS 路径转换） ----------

let msysRoot = null;

// 获取 MSYS（Git Bash）根目录，如 C:/Program Files/Git
function getMsysRoot() {
    if (msysRoot !== null) return msysRoot;
    if (!process.env.MSYSTEM) {
        msysRoot = "";
        return msysRoot;
    }
    try {
        const out = execFileSync("cygpath", ["-m", "/"], {
            encoding: "utf-8",
            windowsHide: true,
        }).trim();
        msysRoot = out.replace(/\\/g, "/").replace(/\/+$/, "");
    } catch {
        msysRoot = "";
    }
    return msysRoot;
}

// 归一化 URL 前缀：/api-demo 在 cmd/PowerShell 原样传入；
// 在 Git Bash 中会被转成 C:/Program Files/Git/api-demo，这里还原为 /api-demo
function normalizeUrlPrefix(raw) {
    let v = String(raw).trim().replace(/\\/g, "/");
    if (v.startsWith("/")) return v.replace(/\/+$/, "") || "/";

    if (/^[A-Za-z]:\//.test(v)) {
        const root = getMsysRoot();
        if (root && v.toLowerCase().startsWith(root.toLowerCase() + "/")) {
            return "/" + v.slice(root.length + 1);
        }
        // 兜底：取最后一个名为 git 的目录之后的部分
        const segs = v.slice(v.indexOf("/") + 1).split("/");
        let gitIdx = -1;
        for (let i = 0; i < segs.length; i++) {
            if (/^git$/i.test(segs[i])) gitIdx = i;
        }
        if (gitIdx >= 0 && gitIdx < segs.length - 1) {
            return "/" + segs.slice(gitIdx + 1).join("/");
        }
    }
    return "/" + v;
}

// 归一化子路径：去掉前后斜杠，兼容 MSYS 转换
function normalizeSubPath(raw) {
    let v = String(raw).trim().replace(/\\/g, "/");
    if (/^[A-Za-z]:\//.test(v)) {
        const root = getMsysRoot();
        if (root && v.toLowerCase().startsWith(root.toLowerCase() + "/")) {
            v = v.slice(root.length + 1);
        } else {
            const segs = v.slice(v.indexOf("/") + 1).split("/");
            let gitIdx = -1;
            for (let i = 0; i < segs.length; i++) {
                if (/^git$/i.test(segs[i])) gitIdx = i;
            }
            if (gitIdx >= 0 && gitIdx < segs.length - 1) {
                v = segs.slice(gitIdx + 1).join("/");
            }
        }
    }
    return v.replace(/^\/+|\/+$/g, "");
}

// ---------- 参数解析 ----------
function parseArgs(argv) {
    const name = argv[0];
    if (!name) {
        console.error(
            "用法: node scripts/create-project.mjs <项目名> [--dir <目录>] [--port <端口>] [--subpath <子路径>] [--proxy <前缀,可多次>]",
        );
        process.exit(1);
    }
    const opts = { name, dir: `vue-${name}`, port: undefined, subpath: name, proxy: [] };
    for (let i = 1; i < argv.length; i++) {
        const a = argv[i];
        const keys = ["--dir", "--port", "--subpath", "--proxy"];
        if (keys.includes(a) && argv[i + 1]) {
            const v = argv[++i];
            if (a === "--dir") opts.dir = v;
            else if (a === "--port") opts.port = Number(v);
            else if (a === "--subpath") opts.subpath = normalizeSubPath(v);
            else opts.proxy.push(normalizeUrlPrefix(v));
        }
    }
    return opts;
}

// ---------- 读取现有 projects.json ----------
function loadProjects() {
    return JSON.parse(
        fs.readFileSync(path.join(ROOT, "projects.json"), "utf-8"),
    );
}

// 默认端口 = 现有最大 devPort + 1，自动避免冲突
function nextPort(projects) {
    return projects.reduce((m, p) => Math.max(m, p.devPort || 0), 5174) + 1;
}

// ---------- 注册到 projects.json ----------
function registerProject(entry) {
    const file = path.join(ROOT, "projects.json");
    const projects = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (projects.some((p) => p.dir === entry.dir)) {
        console.log(`[跳过] projects.json 已存在 dir=${entry.dir}`);
        return;
    }
    projects.push(entry);
    fs.writeFileSync(file, JSON.stringify(projects, null, 4) + "\n");
    console.log(`[完成] 已注册到 projects.json: ${entry.name}`);
}

// ---------- 注册到 pnpm-workspace.yaml ----------
function registerWorkspace(dir) {
    const file = path.join(ROOT, "pnpm-workspace.yaml");
    const text = fs.readFileSync(file, "utf-8");
    if (text.includes(`'${dir}'`)) {
        console.log(`[跳过] pnpm-workspace.yaml 已存在 ${dir}`);
        return;
    }
    const lines = text.split("\n");
    const pkgIdx = lines.findIndex((l) => l.trim() === "packages:");
    let insertIdx = lines.length;
    for (let i = pkgIdx + 1; i < lines.length; i++) {
        if (/^\S/.test(lines[i])) {
            insertIdx = i;
            break;
        }
    }
    lines.splice(insertIdx, 0, `  - '${dir}'`);
    fs.writeFileSync(file, lines.join("\n"));
    console.log(`[完成] 已加入 pnpm-workspace.yaml: ${dir}`);
}

// ---------- 生成模板文件 ----------
function render(content, vars) {
    return content.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
}

function copyTemplate(targetDir, vars) {
    const walk = (src, dst) => {
        for (const entry of fs.readdirSync(src)) {
            const s = path.join(src, entry);
            const d = path.join(dst, entry);
            if (fs.statSync(s).isDirectory()) {
                fs.mkdirSync(d, { recursive: true });
                walk(s, d);
            } else {
                fs.writeFileSync(d, render(fs.readFileSync(s, "utf-8"), vars));
            }
        }
    };
    fs.mkdirSync(targetDir, { recursive: true });
    walk(TEMPLATE_DIR, targetDir);
}

// ---------- 主流程 ----------
function main() {
    const opts = parseArgs(process.argv.slice(2));
    const projects = loadProjects();
    const port = opts.port ?? nextPort(projects);

    const targetDir = path.resolve(ROOT, opts.dir);
    if (fs.existsSync(targetDir)) {
        console.error(`[错误] 目录已存在: ${opts.dir}`);
        process.exit(1);
    }

    copyTemplate(targetDir, { name: opts.name, subpath: opts.subpath, port: String(port) });

    registerProject({
        name: opts.name,
        dir: opts.dir,
        buildCmd: "pnpm run build",
        outputDir: "output",
        subPath: opts.subpath,
        devPort: port,
        proxyApi: opts.proxy,
    });
    registerWorkspace(opts.dir);

    console.log("");
    console.log(`新子项目已创建: ${opts.dir}`);
    console.log(`  端口: ${port}  子路径: /${opts.subpath}/`);
    console.log("下一步:");
    console.log("  1. pnpm install");
    console.log("  2. pnpm run dev   # 主站开发服务器会自动代理该子项目");
}

main();
