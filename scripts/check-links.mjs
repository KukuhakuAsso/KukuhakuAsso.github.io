// scripts/check-links.mjs
// 静态链接/资源检查：扫描 docs 下的 markdown，验证相对链接、站内绝对路径与图片路径指向的文件是否存在。
// 覆盖：
//   - markdown 链接 [text](url) 与图片 ![alt](url)
//   - 行内 HTML 的 href / src
// 规则：
//   - 跳过 http(s)/mailto/tel/data/// 等外部或特殊协议
//   - 跳过纯锚点（#xxx）与 VitePress 别名路径（@ 开头）
//   - 相对路径按“当前 md 文件目录”解析；绝对路径（/ 开头）按 docs/ 与 docs/public/ 解析
//   - .md 链接允许匹配 foo.md / foo/index.md / foo（VitePress 路由）
//   - 锚点检查：链接目标文件内需存在对应 heading slug 或 id="xxx"（缺失仅告警）
// 缺失的目标文件 → 错误（退出码 1）；锚点缺失 → 告警。
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DOCS_DIR = path.resolve(ROOT_DIR, "docs");
const PUBLIC_DIR = path.join(DOCS_DIR, "public");

const EXCLUDED_DIRS = ["cache", "dist"];

const errors = [];
const warnings = [];

function walkMd(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") && entry.name !== ".vitepress") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.includes(entry.name)) continue;
            out.push(...walkMd(full));
        } else if (entry.name.endsWith(".md")) {
            out.push(full);
        }
    }
    return out;
}

// 提取 markdown 链接与图片（排除代码块内的内容：用简单的行级扫描 + 围栏状态）
function extractUrls(mdPath) {
    const text = fs.readFileSync(mdPath, "utf-8");
    const refs = []; // { raw, target, kind: 'link'|'image', line }
    const lines = text.split("\n");
    let inFence = false;
    lines.forEach((line, idx) => {
        const trimmed = line.trimStart();
        if (/^```/.test(trimmed) || /^~~~/.test(trimmed)) {
            inFence = !inFence;
            return;
        }
        if (inFence) return;
        const lineNo = idx + 1;

        // markdown 链接 / 图片（支持尖括号包裹的 URL，如 [x](<https://...(...)>)）
        const mdLink = /!?\[([^\]]*)\]\((<[^>]+>|[^)\s]+)\)/g;
        let m;
        while ((m = mdLink.exec(line)) !== null) {
            const isImage = m[0].startsWith("!");
            refs.push({
                target: m[2],
                kind: isImage ? "image" : "link",
                line: lineNo,
            });
        }
        // HTML href / src
        const htmlAttr = /(?:href|src)=["']([^"']+)["']/g;
        while ((m = htmlAttr.exec(line)) !== null) {
            refs.push({ target: m[1], kind: "html", line: lineNo });
        }
    });
    return refs;
}

// 判断是否为需跳过的外部/特殊协议
function isSkipped(url) {
    return (
        /^(https?:|mailto:|tel:|data:|javascript:|ftp:|#|\/\/)/i.test(url) ||
        url.startsWith("@") ||
        url.includes("{{") || // 模板占位
        /[?]/.test(url) || // 带查询参数的统一跳过，避免误报（实际链接检查难覆盖动态参数）
        url.startsWith("vscode-webview") ||
        url === "/" ||
        url === ""
    );
}

// 把 URL 拆成 路径部分 + 锚点部分
function splitHash(url) {
    const i = url.indexOf("#");
    if (i === -1) return { pathPart: url, anchor: "" };
    return { pathPart: url.slice(0, i), anchor: url.slice(i + 1) };
}

// 判断一个文件路径是否存在（对 md 做多种候选匹配）
function resolveTarget(absBase, pathPart) {
    if (!pathPart) return null;
    const candidates = [];
    const raw = path.resolve(absBase, pathPart);
    candidates.push(raw);
    if (pathPart.endsWith(".md")) {
        candidates.push(raw.slice(0, -3)); // foo.md -> foo
    } else {
        candidates.push(raw + ".md");
        candidates.push(path.join(raw, "index.md"));
        candidates.push(path.join(raw, "index.html"));
        candidates.push(raw + ".html");
    }
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return null;
}

// 解析绝对路径（/ 开头）：优先 docs 内容，再 docs/public
function resolveAbsolute(pathPart) {
    const clean = pathPart.replace(/^\/+/, "");
    const contentBase = DOCS_DIR;
    const found =
        resolveTarget(contentBase, clean) || resolveTarget(PUBLIC_DIR, clean);
    return found;
}

// 校验目标文件内是否存在指定锚点
function hasAnchor(filePath, anchor) {
    if (!anchor) return true;
    try {
        const text = fs.readFileSync(filePath, "utf-8");
        if (new RegExp(`id=["']${escapeRegExp(anchor)}["']`).test(text))
            return true;
        // heading slug 匹配（小写、空格转 -、去标点）
        const slug = slugify(anchor);
        const headingRe = new RegExp(
            `^#{1,6}\\s+.*$`,
            "m",
        );
        const headings = text.match(headingRe) || [];
        for (const h of headings) {
            const title = h.replace(/^#{1,6}\s*/, "").replace(/\s*\{.*\}\s*$/, "");
            if (slugify(title) === slug) return true;
        }
        return false;
    } catch {
        return false;
    }
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(s) {
    return s
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

const mdFiles = walkMd(DOCS_DIR);
console.log(`🔍 扫描 ${mdFiles.length} 个 markdown 文件...`);

for (const mdPath of mdFiles) {
    const rel = path.relative(ROOT_DIR, mdPath).replace(/\\/g, "/");
    const dir = path.dirname(mdPath);
    for (const ref of extractUrls(mdPath)) {
        let url = ref.target.trim();
        // 去除 markdown 尖括号包裹 <url>
        if (url.startsWith("<") && url.endsWith(">")) {
            url = url.slice(1, -1);
        }
        if (isSkipped(url)) continue;

        const { pathPart, anchor } = splitHash(url);
        let resolved;

        if (pathPart.startsWith("/")) {
            resolved = resolveAbsolute(pathPart);
        } else if (pathPart) {
            resolved = resolveTarget(dir, pathPart);
        } else {
            // 纯锚点：目标即当前文件
            resolved = mdPath;
        }

        if (!resolved) {
            errors.push(`${rel}:${ref.line} [${ref.kind}] 目标不存在: ${url}`);
            continue;
        }

        // 资源类（image/html src）通常不带 md 锚点；链接才做锚点校验
        if (anchor && ref.kind === "link") {
            if (!hasAnchor(resolved, anchor)) {
                warnings.push(
                    `${rel}:${ref.line} [link] 锚点 #${anchor} 在目标文件中未找到: ${url}`,
                );
            }
        }
    }
}

// 去重输出
if (warnings.length) {
    console.log(`\n⚠️  锚点告警 (${warnings.length}):`);
    for (const w of [...new Set(warnings)].slice(0, 100)) console.log("  " + w);
}
if (errors.length) {
    console.error(`\n❌ 发现 ${errors.length} 个失效链接/资源:`);
    for (const e of [...new Set(errors)].slice(0, 100)) console.error("  " + e);
    process.exit(1);
}
console.log("\n✅ 未发现失效链接/资源");
