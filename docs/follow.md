---
title: 关注我们
editLink: false
lastUpdated: false
---
<script setup>
    // 引入 VitePress 内置的社交图标组件
    import VPSocialLinks from "vitepress/dist/client/theme-default/components/VPSocialLinks.vue";
</script>

<style scoped>
    /* 让标题变成弹性盒，使图标与文字完美居中对齐 */
    h2 {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* 控制图标组件的样式 */
    :deep(.inline-icon) {
        display: inline-flex;
        margin: 0;
    }

    /* 调整图标的大小（可根据需要修改 width 和 height） */
    :deep(.inline-icon .VPSocialLink svg) {
        width: 28px;
        height: 28px;
    }
</style>

---

# 关注我们

> **空白永不败北。** 想要获取空白解谜组的最新动态、ARG 解谜进展，或是《重返未来：1999》的最深度的剧情考据？欢迎通过以下渠道锁定我们！

## <VPSocialLinks :links="[{ icon: 'bilibili', link: 'https://space.bilibili.com/3706992621258932' }]" class="inline-icon" /> 哔哩哔哩 (Bilibili)

我们在 B 站会不定期分享解谜复盘、剧情解析视频以及各种奇妙的 ARG 探索记录。欢迎点赞、投币、收藏三连！

- **官方账号**：[空白解谜组的B站主页](https://space.bilibili.com/3706992621258932)
- **直播间**：[点击进入直播间](https://live.bilibili.com/你的直播间ID) _(如果有的话)_

::: tip 提示
点击上方链接即可直接跳转，关注我们不迷路！
:::

---

## <VPSocialLinks :links="[{ icon: 'rss', link: 'https://kukuhakuasso.github.io/feed.xml' }]" class="inline-icon" /> RSS 订阅

不想错过博客的任何一篇精彩深度长文？使用 RSS 订阅是最佳选择。你可以将本站的 RSS 链接复制到你常用的阅读器（如 NetNewsWire, Feedly, Reeder 等）中。

- **RSS 订阅源地址**：`https://kukuhakuasso.github.io/feed.xml`

::: info 如何订阅？

1. 复制上方的订阅源地址。
2. 打开你喜欢的 RSS 阅读器。
3. 添加新订阅（Add Subscription），粘贴该链接即可。
   :::

---

## 💬 交流与反馈

如果你对我们的解谜内容感兴趣，或者发现了新的 ARG 线索，欢迎随时联系我们：

- <VPSocialLinks :links="[{ icon: 'github', link: 'https://github.com/KukuhakuAsso/KukuhakuAsso.github.io' }]" class="inline-icon" /> **GitHub 仓库**：[点击前往](https://github.com/kukuhakuasso)
- **神秘暗号**：欢迎在 B 站私信，期待与同为箱中旅客的你相遇。
