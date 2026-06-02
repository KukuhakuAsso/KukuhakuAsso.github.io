// docs/.vitepress/components/posts.data.mjs
import { createContentLoader } from "vitepress";

// 开启深度扫描，捕获 posts 下的所有子目录文章
export default createContentLoader("posts/**/*.md", {
    transform(raw) {
        return raw
            .filter(({ url }) => !url.endsWith("index.html")) 
            .map(({ url, frontmatter }) => {
                
                // 自动分类逻辑：如果文章在子目录中（比如 lore），我们提取出子目录名作为分类
                const urlParts = url.split('/');
                
                // 如果长度大于 3，说明它在子目录中（比如 lore），我们提取出索引为 2 的值
                const autoCategory = urlParts.length > 3 ? urlParts[2] : 'uncategorized';

                return {
                    title: frontmatter.title || "未命名档案",
                    url,
                    date: frontmatter.date
                        ? new Date(frontmatter.date).toISOString().slice(0, 10)
                        : "未知时间",
                        
                    // ✨ 优先级逻辑：如果文章顶部手动写了 category，优先用手写的；如果没有写，全自动使用子目录名！
                    category: frontmatter.category || autoCategory,
                };
            })
            .sort((a, b) => b.date.localeCompare(a.date)); 
    },
});
